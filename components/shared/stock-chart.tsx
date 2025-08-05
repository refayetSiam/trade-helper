'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Area,
  AreaChart,
  Brush,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
  LabelList,
  Cell,
} from 'recharts';
import { ChartDataPoint, TechnicalIndicators, ChartType } from '@/lib/services/chart-data';
import {
  PatternDetectionService,
  DetectedPattern,
  PatternOverlay,
} from '@/lib/services/pattern-detection';
import { format } from 'date-fns';

interface StockChartProps {
  data: ChartDataPoint[];
  indicators: TechnicalIndicators;
  chartType: ChartType;
  selectedIndicators: string[];
  symbol: string;
  className?: string;
  onPatternClick?: (pattern: DetectedPattern) => void;
  patternsEnabled?: boolean;
  patternTypes?: string[];
  swingTradingMode?: boolean;
  intradayMode?: boolean;
}

const StockChart: React.FC<StockChartProps> = ({
  data,
  indicators,
  chartType,
  selectedIndicators,
  symbol,
  className = '',
  onPatternClick,
  patternsEnabled = true,
  patternTypes = ['candlestick', 'combination', 'confluence'],
  swingTradingMode = false,
  intradayMode = false,
}) => {
  // Zoom and pan state
  const [zoomDomain, setZoomDomain] = useState<{ left: number; right: number } | null>(null);
  const [windowWidth, setWindowWidth] = useState(1280); // Default to large screen

  // Handle window resize for responsive chart height
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Reset zoom when data changes
  useMemo(() => {
    setZoomDomain(null);
  }, [data]);

  // Handle zoom
  const handleZoom = (domain: any) => {
    if (domain && domain.left !== undefined && domain.right !== undefined) {
      setZoomDomain(domain);
    }
  };

  // Reset zoom function
  const resetZoom = () => {
    setZoomDomain(null);
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    // Only prevent default if Ctrl key is held (common zoom pattern) or if already zoomed
    const shouldZoom = e.ctrlKey || e.metaKey || zoomDomain !== null;

    if (!shouldZoom) {
      return; // Allow normal page scrolling
    }

    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    if (zoomDomain) {
      const range = zoomDomain.right - zoomDomain.left;
      const center = (zoomDomain.left + zoomDomain.right) / 2;
      const newRange = range * zoomFactor;

      setZoomDomain({
        left: Math.max(0, center - newRange / 2),
        right: Math.min(chartData.length - 1, center + newRange / 2),
      });
    } else {
      // Initial zoom
      const center = chartData.length / 2;
      const initialRange = chartData.length * 0.3; // Show 30% of data initially

      setZoomDomain({
        left: Math.max(0, center - initialRange / 2),
        right: Math.min(chartData.length - 1, center + initialRange / 2),
      });
    }
  };
  // Detect patterns and generate overlays
  const { detectedPatterns, patternOverlays, supportResistanceLevels } = useMemo(() => {
    if (!patternsEnabled || !data || data.length < 10) {
      console.log('Pattern detection skipped:', { patternsEnabled, dataLength: data?.length });
      return { detectedPatterns: [], patternOverlays: [], supportResistanceLevels: [] };
    }

    console.log('Running pattern detection with:', {
      dataLength: data.length,
      patternTypes,
      indicatorsAvailable: Object.keys(indicators).length,
    });

    let allPatterns: DetectedPattern[] = [];

    // Detect support/resistance levels (always needed for combinations)
    const supportResistance = PatternDetectionService.detectSupportResistance(data);

    // Swing Trading Mode: Only show swing trading signals
    if (swingTradingMode) {
      const swingSignals = PatternDetectionService.detectSwingTradingSignals(
        data,
        indicators,
        supportResistance
      );
      allPatterns = [...allPatterns, ...swingSignals];
    } else if (intradayMode) {
      // Intraday Mode: Only show intraday gap-up breakout signals
      const intradaySignals = PatternDetectionService.detectIntradayGapUpBreakout(data, indicators);
      allPatterns = [...allPatterns, ...intradaySignals];
    } else {
      // Regular pattern detection based on enabled types
      if (patternTypes.includes('candlestick')) {
        const patterns = PatternDetectionService.detectCandlestickPatterns(data);
        allPatterns = [...allPatterns, ...patterns];
      }

      if (patternTypes.includes('confluence')) {
        const confluencePatterns = PatternDetectionService.detectConfluence(
          allPatterns,
          supportResistance,
          data
        );
        allPatterns = [...allPatterns, ...confluencePatterns];
      }

      if (patternTypes.includes('combination')) {
        const advancedCombinations = PatternDetectionService.detectAdvancedCombinations(
          data,
          supportResistance,
          indicators
        );
        allPatterns = [...allPatterns, ...advancedCombinations];
      }

      if (patternTypes.includes('swing_strategy')) {
        const swingStrategies = PatternDetectionService.detectTripleConfirmationBounce(
          data,
          indicators
        );
        allPatterns = [...allPatterns, ...swingStrategies];
      }
    }

    // Filter patterns to prevent chart clutter - keep only top 3 highest confidence
    allPatterns = allPatterns
      .sort((a, b) => {
        // Sort by confidence (high=3, medium=2, low=1) then by probability
        const confidenceScore = (pattern: DetectedPattern) =>
          pattern.confidence === 'high' ? 3 : pattern.confidence === 'medium' ? 2 : 1;
        const scoreA = confidenceScore(a) * 100 + a.probability;
        const scoreB = confidenceScore(b) * 100 + b.probability;
        return scoreB - scoreA;
      })
      .slice(0, 3); // Keep only top 3 patterns

    // Generate overlays for visualization
    const overlays = PatternDetectionService.generatePatternOverlays(
      allPatterns,
      supportResistance,
      data
    );

    console.log('Pattern detection results:', {
      patternsFound: allPatterns.length,
      overlaysGenerated: overlays.length,
      patternTypes: allPatterns.map(p => p.type),
      patternNames: allPatterns.map(p => p.name),
    });

    return {
      detectedPatterns: allPatterns,
      patternOverlays: overlays,
      supportResistanceLevels: supportResistance,
    };
  }, [data, indicators, patternsEnabled, patternTypes, swingTradingMode, intradayMode]);

  // Prepare chart data with indicators and pattern markers
  const chartData = useMemo(() => {
    return data.map((point, index) => {
      const dataPoint: any = {
        ...point,
        dateStr: format(point.date, 'MMM dd'),
        volumeM: point.volume / 1000000, // Volume in millions
        index, // Add index for pattern matching
      };

      dataPoint.volumeColor =
        index > 0 && point.close >= data[index - 1].close ? '#34d399' : '#f87171'; // Lighter green if price up, lighter red if down

      // Add indicators
      dataPoint.rsi = indicators.rsi?.[index] || null;
      dataPoint.macd = indicators.macd?.macd[index] || null;
      dataPoint.macdSignal = indicators.macd?.signal[index] || null;
      dataPoint.macdHistogram = indicators.macd?.histogram[index] || null;
      dataPoint.sma20 = indicators.sma?.sma20?.[index] || null;
      dataPoint.sma50 = indicators.sma?.sma50?.[index] || null;
      dataPoint.sma200 = indicators.sma?.sma200?.[index] || null;
      dataPoint.ema12 = indicators.ema?.ema12?.[index] || null;
      dataPoint.ema26 = indicators.ema?.ema26?.[index] || null;
      dataPoint.bbUpper = indicators.bollingerBands?.upper[index] || null;
      dataPoint.bbMiddle = indicators.bollingerBands?.middle[index] || null;
      dataPoint.bbLower = indicators.bollingerBands?.lower[index] || null;
      dataPoint.stochK = indicators.stochastic?.k[index] || null;
      dataPoint.stochD = indicators.stochastic?.d[index] || null;
      dataPoint.obv = indicators.obv?.[index] || null;
      dataPoint.vwap = indicators.vwap?.[index] || null;

      // Mark pattern points
      const patternAtIndex = detectedPatterns.find(
        p => index >= p.startIndex && index <= p.endIndex
      );
      if (patternAtIndex) {
        dataPoint.patternName = patternAtIndex.name;
        dataPoint.patternCode = patternAtIndex.code;
      }

      return dataPoint;
    });
  }, [data, indicators, detectedPatterns]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>

          {/* OHLC Data */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono text-foreground">${data.open?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono text-green-600">${data.high?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono text-red-600">${data.low?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono font-semibold text-foreground">
                ${data.close?.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono text-foreground">{data.volumeM?.toFixed(2)}M</span>
            </div>
          </div>

          {/* Indicators */}
          {selectedIndicators.includes('rsi') && data.rsi && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-muted-foreground">RSI:</span>
                <span className="font-mono text-foreground">{data.rsi.toFixed(2)}</span>
              </div>
            </div>
          )}

          {selectedIndicators.includes('macd') && data.macd && (
            <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">MACD:</span>
                <span className="font-mono text-foreground">{data.macd.toFixed(4)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Signal:</span>
                <span className="font-mono text-foreground">{data.macdSignal?.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Custom legend showing pattern information
  const CustomLegend = () => {
    if (detectedPatterns.length === 0) return null;

    return (
      <div className="absolute top-2 left-16 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="text-sm font-semibold text-foreground mb-2">Active Patterns</h4>
        <div className="space-y-2 text-xs">
          {detectedPatterns.map((pattern, idx) => {
            const currentPrice = chartData[pattern.endIndex]?.close || 0;
            const entryPercentChange = ((pattern.entryPrice - currentPrice) / currentPrice) * 100;
            const tpPercentChange =
              ((pattern.targetPrice - pattern.entryPrice) / pattern.entryPrice) * 100;
            const slPercentChange =
              ((pattern.stopLoss - pattern.entryPrice) / pattern.entryPrice) * 100;

            return (
              <div
                key={idx}
                className="p-2 bg-muted/30 rounded border-l-2"
                style={{
                  borderLeftColor:
                    pattern.signal === 'bullish'
                      ? '#10b981'
                      : pattern.signal === 'bearish'
                        ? '#ef4444'
                        : '#3b82f6',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {pattern.code || pattern.name.substring(0, 3).toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-1 py-0.5 rounded ${
                      pattern.signal === 'bullish'
                        ? 'bg-green-100 text-green-800'
                        : pattern.signal === 'bearish'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {pattern.signal}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-blue-600 font-medium">ENTRY:</span>
                    <span className="font-mono">${pattern.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-green-600 font-medium">TP:</span>
                    <span className="font-mono">
                      ${pattern.targetPrice.toFixed(2)} (+{tpPercentChange.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-red-600 font-medium">SL:</span>
                    <span className="font-mono">
                      ${pattern.stopLoss.toFixed(2)} ({slPercentChange.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span
                      className={`font-medium ${
                        pattern.confidence === 'high'
                          ? 'text-green-600'
                          : pattern.confidence === 'medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {pattern.confidence} ({pattern.probability}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom volume bar shape that limits height to 1/4 of chart
  const VolumeBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    const color = payload.volumeColor;

    // Simply return the bar with dynamic color
    // The height limitation will be handled by the Y-axis domain
    return <rect x={x} y={y} width={width} height={height} fill={color} opacity={0.6} />;
  };

  // Handle pattern click
  const handlePatternClick = (overlay: PatternOverlay) => {
    // Find the corresponding pattern
    const pattern = detectedPatterns.find(
      p =>
        overlay.label?.includes(p.name) ||
        (overlay.startX >= p.startIndex && overlay.startX <= p.endIndex)
    );

    if (pattern && onPatternClick) {
      onPatternClick(pattern);
    }
  };

  // Render combined price and volume chart
  const renderMainChart = () => {
    // Responsive height: taller on larger screens
    const height = windowWidth >= 1280 ? 650 : windowWidth >= 768 ? 550 : 450;

    switch (chartType) {
      case 'area':
        return (
          <div className="relative" onWheel={handleWheel}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  stroke="#ffffff"
                  fontSize={12}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `$${parseFloat(value).toFixed(1)}`}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `${(value / 1000000).toFixed(0)}M`}
                  domain={[0, (dataMax: number) => dataMax * 4]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
                  isAnimationActive={false}
                />

                {/* Volume Bars */}
                <Bar yAxisId="volume" dataKey="volume" name="Volume" shape={VolumeBar} />

                {/* Price Area */}
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  fill="url(#colorClose)"
                  strokeWidth={2}
                  name={`${symbol} Close`}
                />

                {/* Moving Averages */}
                {selectedIndicators.includes('sma20') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 20"
                  />
                )}
                {selectedIndicators.includes('sma50') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma50"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 50"
                  />
                )}
                {selectedIndicators.includes('bollinger') && (
                  <>
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="bbUpper"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                      name="BB Upper"
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="bbLower"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                      name="BB Lower"
                    />
                  </>
                )}

                {/* Support and Resistance Lines */}
                {supportResistanceLevels &&
                  supportResistanceLevels.map((level, idx) => (
                    <ReferenceLine
                      key={`sr-${idx}`}
                      yAxisId="price"
                      y={level.price}
                      stroke={level.type === 'support' ? '#10b981' : '#ef4444'}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `${level.type === 'support' ? 'S' : 'R'}${level.strength > 1 ? level.strength : ''}: ${level.price.toFixed(1)}`,
                        position: 'left',
                        fill: level.type === 'support' ? '#10b981' : '#ef4444',
                        fontSize: 12,
                      }}
                    />
                  ))}

                {/* Swing Trading Entry Zones */}
                {swingTradingMode &&
                  detectedPatterns
                    .filter(p => p.signal === 'bullish')
                    .map((pattern, idx) => {
                      const startData = chartData[pattern.startIndex];
                      const endData = chartData[pattern.endIndex];
                      if (!startData || !endData) return null;

                      // Calculate entry zone (typically 2-3% below the signal price)
                      const signalPrice = chartData[pattern.endIndex]?.close || 0;
                      const entryZoneBottom = signalPrice * 0.97; // 3% below signal
                      const entryZoneTop = signalPrice * 0.99; // 1% below signal

                      return (
                        <ReferenceArea
                          key={`entry-zone-${idx}`}
                          x1={startData.dateStr}
                          x2={endData.dateStr}
                          y1={entryZoneBottom}
                          y2={entryZoneTop}
                          yAxisId="price"
                          fill="#10b981"
                          fillOpacity={0.15}
                          stroke="#10b981"
                          strokeOpacity={0.3}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      );
                    })}

                {/* Entry/Exit Lines for All Patterns */}
                {detectedPatterns.map((pattern, idx) => {
                  const currentPrice = chartData[pattern.endIndex]?.close || 0;
                  const entryPercentChange =
                    ((pattern.entryPrice - currentPrice) / currentPrice) * 100;
                  const tpPercentChange =
                    ((pattern.targetPrice - pattern.entryPrice) / pattern.entryPrice) * 100;
                  const slPercentChange =
                    ((pattern.stopLoss - pattern.entryPrice) / pattern.entryPrice) * 100;

                  return (
                    <g key={`trade-lines-${idx}`}>
                      {/* Entry Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.entryPrice}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="0"
                        label={{
                          value: `ENTRY: $${pattern.entryPrice.toFixed(2)}`,
                          position: 'left',
                          fill: '#3b82f6',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Take Profit Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.targetPrice}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `TP: $${pattern.targetPrice.toFixed(2)} (+${tpPercentChange.toFixed(1)}%)`,
                          position: 'right',
                          fill: '#10b981',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Stop Loss Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.stopLoss}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `SL: $${pattern.stopLoss.toFixed(2)} (${slPercentChange.toFixed(1)}%)`,
                          position: 'center',
                          fill: '#ef4444',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    </g>
                  );
                })}

                {/* Pattern Markers */}
                {detectedPatterns.map((pattern, idx) => {
                  const midIndex = Math.floor((pattern.startIndex + pattern.endIndex) / 2);
                  const patternData = chartData[midIndex];
                  if (!patternData) return null;

                  return (
                    <ReferenceDot
                      key={`pattern-${idx}`}
                      x={patternData.dateStr}
                      y={patternData.high * 1.02} // Position slightly above high
                      yAxisId="price"
                      r={6}
                      fill={
                        pattern.signal === 'bullish'
                          ? '#10b981'
                          : pattern.signal === 'bearish'
                            ? '#ef4444'
                            : '#3b82f6'
                      }
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={{
                        value: `${pattern.code || pattern.name.substring(0, 2).toUpperCase()}`,
                        position: 'top',
                        fill:
                          pattern.signal === 'bullish'
                            ? '#10b981'
                            : pattern.signal === 'bearish'
                              ? '#ef4444'
                              : '#3b82f6',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      data-tooltip={`${pattern.name}: ${pattern.description || `${pattern.signal} signal with ${pattern.probability}% confidence`}`}
                      onClick={() => onPatternClick && onPatternClick(pattern)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}

                {/* Interactive Brush for zoom and pan */}
                <Brush
                  dataKey="dateStr"
                  height={30}
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  startIndex={zoomDomain?.left || 0}
                  endIndex={zoomDomain?.right || chartData.length - 1}
                  onChange={handleZoom}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Custom Legend with Pattern Info */}
            <CustomLegend />

            {/* No Good Entry Indicator */}
            {patternsEnabled && detectedPatterns.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-orange-900/80 backdrop-blur-sm border border-orange-500/50 rounded-lg px-6 py-4 text-center max-w-md">
                  <h3 className="text-orange-200 font-bold text-lg mb-2">
                    No Good Entry Opportunities Right Now
                  </h3>
                  <p className="text-orange-300 text-sm">
                    {swingTradingMode
                      ? 'No swing setups found. Wait for trend + volume + momentum alignment.'
                      : intradayMode
                        ? 'No gap-up breakouts detected. Look for morning gaps >0.3% with volume.'
                        : 'No significant patterns found. Try enabling specific trading modes.'}
                  </p>
                </div>
              </div>
            )}

            {/* PatternOverlayComponent removed - patterns now rendered inline */}
          </div>
        );

      case 'candlestick':
        return (
          <div className="relative" onWheel={handleWheel}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  stroke="#ffffff"
                  fontSize={12}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `$${parseFloat(value).toFixed(1)}`}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `${(value / 1000000).toFixed(0)}M`}
                  domain={[0, (dataMax: number) => dataMax * 4]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
                  isAnimationActive={false}
                />

                {/* Volume Bars */}
                <Bar yAxisId="volume" dataKey="volume" name="Volume" shape={VolumeBar} />

                {/* Candlestick */}
                <Bar
                  yAxisId="price"
                  dataKey="close"
                  name={`${symbol} Price`}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    if (!payload) return <></>; // Return empty fragment instead of null

                    // Calculate price range for this chart
                    const minPrice = Math.min(...chartData.map(d => d.low));
                    const maxPrice = Math.max(...chartData.map(d => d.high));
                    const priceRange = maxPrice - minPrice;
                    const chartHeight = 450 * 0.75; // 75% of chart height for price area

                    // Scale function for prices
                    const scalePrice = (price: number) => {
                      return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
                    };

                    const open = scalePrice(payload.open);
                    const close = scalePrice(payload.close);
                    const high = scalePrice(payload.high);
                    const low = scalePrice(payload.low);
                    const isGreen = payload.close >= payload.open;
                    const color = isGreen ? '#34d399' : '#f87171';
                    const bodyHeight = Math.abs(close - open);
                    const bodyY = Math.min(open, close);

                    return (
                      <g>
                        {/* High-Low line */}
                        <line
                          x1={x + width / 2}
                          y1={high}
                          x2={x + width / 2}
                          y2={low}
                          stroke={color}
                          strokeWidth={1}
                        />
                        {/* Open-Close body */}
                        <rect
                          x={x + width * 0.25}
                          y={bodyY}
                          width={width * 0.5}
                          height={bodyHeight || 1}
                          fill={isGreen ? color : 'none'}
                          stroke={color}
                          strokeWidth={1}
                        />
                      </g>
                    );
                  }}
                />

                {/* Moving Averages */}
                {selectedIndicators.includes('sma20') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 20"
                  />
                )}
                {selectedIndicators.includes('sma50') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma50"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 50"
                  />
                )}
                {selectedIndicators.includes('sma200') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma200"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 200"
                  />
                )}

                {/* Support and Resistance Lines */}
                {supportResistanceLevels &&
                  supportResistanceLevels.map((level, idx) => (
                    <ReferenceLine
                      key={`sr-${idx}`}
                      yAxisId="price"
                      y={level.price}
                      stroke={level.type === 'support' ? '#10b981' : '#ef4444'}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `${level.type === 'support' ? 'S' : 'R'}${level.strength > 1 ? level.strength : ''}: ${level.price.toFixed(1)}`,
                        position: 'left',
                        fill: level.type === 'support' ? '#10b981' : '#ef4444',
                        fontSize: 12,
                      }}
                    />
                  ))}

                {/* Swing Trading Entry Zones */}
                {swingTradingMode &&
                  detectedPatterns
                    .filter(p => p.signal === 'bullish')
                    .map((pattern, idx) => {
                      const startData = chartData[pattern.startIndex];
                      const endData = chartData[pattern.endIndex];
                      if (!startData || !endData) return null;

                      // Calculate entry zone (typically 2-3% below the signal price)
                      const signalPrice = chartData[pattern.endIndex]?.close || 0;
                      const entryZoneBottom = signalPrice * 0.97; // 3% below signal
                      const entryZoneTop = signalPrice * 0.99; // 1% below signal

                      return (
                        <ReferenceArea
                          key={`entry-zone-${idx}`}
                          x1={startData.dateStr}
                          x2={endData.dateStr}
                          y1={entryZoneBottom}
                          y2={entryZoneTop}
                          yAxisId="price"
                          fill="#10b981"
                          fillOpacity={0.15}
                          stroke="#10b981"
                          strokeOpacity={0.3}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      );
                    })}

                {/* Entry/Exit Lines for All Patterns */}
                {detectedPatterns.map((pattern, idx) => {
                  const currentPrice = chartData[pattern.endIndex]?.close || 0;
                  const entryPercentChange =
                    ((pattern.entryPrice - currentPrice) / currentPrice) * 100;
                  const tpPercentChange =
                    ((pattern.targetPrice - pattern.entryPrice) / pattern.entryPrice) * 100;
                  const slPercentChange =
                    ((pattern.stopLoss - pattern.entryPrice) / pattern.entryPrice) * 100;

                  return (
                    <g key={`trade-lines-${idx}`}>
                      {/* Entry Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.entryPrice}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="0"
                        label={{
                          value: `ENTRY: $${pattern.entryPrice.toFixed(2)}`,
                          position: 'left',
                          fill: '#3b82f6',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Take Profit Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.targetPrice}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `TP: $${pattern.targetPrice.toFixed(2)} (+${tpPercentChange.toFixed(1)}%)`,
                          position: 'right',
                          fill: '#10b981',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Stop Loss Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.stopLoss}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `SL: $${pattern.stopLoss.toFixed(2)} (${slPercentChange.toFixed(1)}%)`,
                          position: 'center',
                          fill: '#ef4444',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    </g>
                  );
                })}

                {/* Pattern Markers */}
                {detectedPatterns.map((pattern, idx) => {
                  const midIndex = Math.floor((pattern.startIndex + pattern.endIndex) / 2);
                  const patternData = chartData[midIndex];
                  if (!patternData) return null;

                  return (
                    <ReferenceDot
                      key={`pattern-${idx}`}
                      x={patternData.dateStr}
                      y={patternData.high * 1.02} // Position slightly above high
                      yAxisId="price"
                      r={6}
                      fill={
                        pattern.signal === 'bullish'
                          ? '#10b981'
                          : pattern.signal === 'bearish'
                            ? '#ef4444'
                            : '#3b82f6'
                      }
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={{
                        value: `${pattern.code || pattern.name.substring(0, 2).toUpperCase()}`,
                        position: 'top',
                        fill:
                          pattern.signal === 'bullish'
                            ? '#10b981'
                            : pattern.signal === 'bearish'
                              ? '#ef4444'
                              : '#3b82f6',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      data-tooltip={`${pattern.name}: ${pattern.description || `${pattern.signal} signal with ${pattern.probability}% confidence`}`}
                      onClick={() => onPatternClick && onPatternClick(pattern)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}

                {/* Interactive Brush for zoom and pan */}
                <Brush
                  dataKey="dateStr"
                  height={30}
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  startIndex={zoomDomain?.left || 0}
                  endIndex={zoomDomain?.right || chartData.length - 1}
                  onChange={handleZoom}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Custom Legend with Pattern Info */}
            <CustomLegend />

            {/* No Good Entry Indicator */}
            {patternsEnabled && detectedPatterns.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-orange-900/80 backdrop-blur-sm border border-orange-500/50 rounded-lg px-6 py-4 text-center max-w-md">
                  <h3 className="text-orange-200 font-bold text-lg mb-2">
                    No Good Entry Opportunities Right Now
                  </h3>
                  <p className="text-orange-300 text-sm">
                    {swingTradingMode
                      ? 'No swing setups found. Wait for trend + volume + momentum alignment.'
                      : intradayMode
                        ? 'No gap-up breakouts detected. Look for morning gaps >0.3% with volume.'
                        : 'No significant patterns found. Try enabling specific trading modes.'}
                  </p>
                </div>
              </div>
            )}

            {/* PatternOverlayComponent removed - patterns now rendered inline */}
          </div>
        );

      case 'line':
      default:
        return (
          <div className="relative" onWheel={handleWheel}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  stroke="#ffffff"
                  fontSize={12}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `$${parseFloat(value).toFixed(1)}`}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                  tickFormatter={value => `${(value / 1000000).toFixed(0)}M`}
                  domain={[0, (dataMax: number) => dataMax * 4]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
                  isAnimationActive={false}
                />

                {/* Volume Bars */}
                <Bar yAxisId="volume" dataKey="volume" name="Volume" shape={VolumeBar} />

                {/* Price Line */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  name={`${symbol} Close`}
                />

                {/* Moving Averages */}
                {selectedIndicators.includes('sma20') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 20"
                  />
                )}
                {selectedIndicators.includes('sma50') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma50"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 50"
                  />
                )}
                {selectedIndicators.includes('sma200') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma200"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="SMA 200"
                  />
                )}
                {selectedIndicators.includes('ema12') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema12"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="EMA 12"
                  />
                )}
                {selectedIndicators.includes('ema26') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema26"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="EMA 26"
                  />
                )}
                {selectedIndicators.includes('vwap') && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="vwap"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="VWAP"
                  />
                )}

                {/* Bollinger Bands */}
                {selectedIndicators.includes('bollinger') && (
                  <>
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="bbUpper"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                      name="BB Upper"
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="bbMiddle"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      name="BB Middle"
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="bbLower"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                      name="BB Lower"
                    />
                  </>
                )}

                {/* Support and Resistance Lines */}
                {supportResistanceLevels &&
                  supportResistanceLevels.map((level, idx) => (
                    <ReferenceLine
                      key={`sr-${idx}`}
                      yAxisId="price"
                      y={level.price}
                      stroke={level.type === 'support' ? '#10b981' : '#ef4444'}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `${level.type === 'support' ? 'S' : 'R'}${level.strength > 1 ? level.strength : ''}: ${level.price.toFixed(1)}`,
                        position: 'left',
                        fill: level.type === 'support' ? '#10b981' : '#ef4444',
                        fontSize: 12,
                      }}
                    />
                  ))}

                {/* Swing Trading Entry Zones */}
                {swingTradingMode &&
                  detectedPatterns
                    .filter(p => p.signal === 'bullish')
                    .map((pattern, idx) => {
                      const startData = chartData[pattern.startIndex];
                      const endData = chartData[pattern.endIndex];
                      if (!startData || !endData) return null;

                      // Calculate entry zone (typically 2-3% below the signal price)
                      const signalPrice = chartData[pattern.endIndex]?.close || 0;
                      const entryZoneBottom = signalPrice * 0.97; // 3% below signal
                      const entryZoneTop = signalPrice * 0.99; // 1% below signal

                      return (
                        <ReferenceArea
                          key={`entry-zone-${idx}`}
                          x1={startData.dateStr}
                          x2={endData.dateStr}
                          y1={entryZoneBottom}
                          y2={entryZoneTop}
                          yAxisId="price"
                          fill="#10b981"
                          fillOpacity={0.15}
                          stroke="#10b981"
                          strokeOpacity={0.3}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      );
                    })}

                {/* Entry/Exit Lines for All Patterns */}
                {detectedPatterns.map((pattern, idx) => {
                  const currentPrice = chartData[pattern.endIndex]?.close || 0;
                  const entryPercentChange =
                    ((pattern.entryPrice - currentPrice) / currentPrice) * 100;
                  const tpPercentChange =
                    ((pattern.targetPrice - pattern.entryPrice) / pattern.entryPrice) * 100;
                  const slPercentChange =
                    ((pattern.stopLoss - pattern.entryPrice) / pattern.entryPrice) * 100;

                  return (
                    <g key={`trade-lines-${idx}`}>
                      {/* Entry Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.entryPrice}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="0"
                        label={{
                          value: `ENTRY: $${pattern.entryPrice.toFixed(2)}`,
                          position: 'left',
                          fill: '#3b82f6',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Take Profit Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.targetPrice}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `TP: $${pattern.targetPrice.toFixed(2)} (+${tpPercentChange.toFixed(1)}%)`,
                          position: 'right',
                          fill: '#10b981',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />

                      {/* Stop Loss Line */}
                      <ReferenceLine
                        yAxisId="price"
                        y={pattern.stopLoss}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{
                          value: `SL: $${pattern.stopLoss.toFixed(2)} (${slPercentChange.toFixed(1)}%)`,
                          position: 'center',
                          fill: '#ef4444',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    </g>
                  );
                })}

                {/* Pattern Markers */}
                {detectedPatterns.map((pattern, idx) => {
                  const midIndex = Math.floor((pattern.startIndex + pattern.endIndex) / 2);
                  const patternData = chartData[midIndex];
                  if (!patternData) return null;

                  return (
                    <ReferenceDot
                      key={`pattern-${idx}`}
                      x={patternData.dateStr}
                      y={patternData.high * 1.02} // Position slightly above high
                      yAxisId="price"
                      r={6}
                      fill={
                        pattern.signal === 'bullish'
                          ? '#10b981'
                          : pattern.signal === 'bearish'
                            ? '#ef4444'
                            : '#3b82f6'
                      }
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={{
                        value: `${pattern.code || pattern.name.substring(0, 2).toUpperCase()}`,
                        position: 'top',
                        fill:
                          pattern.signal === 'bullish'
                            ? '#10b981'
                            : pattern.signal === 'bearish'
                              ? '#ef4444'
                              : '#3b82f6',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      data-tooltip={`${pattern.name}: ${pattern.description || `${pattern.signal} signal with ${pattern.probability}% confidence`}`}
                      onClick={() => onPatternClick && onPatternClick(pattern)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}

                {/* Interactive Brush for zoom and pan */}
                <Brush
                  dataKey="dateStr"
                  height={30}
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  startIndex={zoomDomain?.left || 0}
                  endIndex={zoomDomain?.right || chartData.length - 1}
                  onChange={handleZoom}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Custom Legend with Pattern Info */}
            <CustomLegend />

            {/* No Good Entry Indicator */}
            {patternsEnabled && detectedPatterns.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-orange-900/80 backdrop-blur-sm border border-orange-500/50 rounded-lg px-6 py-4 text-center max-w-md">
                  <h3 className="text-orange-200 font-bold text-lg mb-2">
                    No Good Entry Opportunities Right Now
                  </h3>
                  <p className="text-orange-300 text-sm">
                    {swingTradingMode
                      ? 'No swing setups found. Wait for trend + volume + momentum alignment.'
                      : intradayMode
                        ? 'No gap-up breakouts detected. Look for morning gaps >0.3% with volume.'
                        : 'No significant patterns found. Try enabling specific trading modes.'}
                  </p>
                </div>
              </div>
            )}

            {/* PatternOverlayComponent removed - patterns now rendered inline */}
          </div>
        );
    }
  };

  // Oscillator charts (RSI, Stochastic, MACD)
  const renderOscillatorCharts = () => {
    const oscillators = selectedIndicators.filter(ind =>
      ['rsi', 'stochastic', 'macd'].includes(ind)
    );

    if (oscillators.length === 0) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* RSI */}
        {selectedIndicators.includes('rsi') && (
          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
              RSI (14)
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={12}
                  domain={[0, 100]}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: '#ffffff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                {/* RSI levels */}
                <Line
                  type="monotone"
                  dataKey={() => 70}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => 30}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* MACD */}
        {selectedIndicators.includes('macd') && (
          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
              MACD (12, 26, 9)
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: '#ffffff',
                  }}
                />
                <Bar dataKey="macdHistogram" fill="#6b7280" opacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stochastic */}
        {selectedIndicators.includes('stochastic') && (
          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: '#ffffff' }}>
              Stochastic (14, 3)
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="dateStr"
                  stroke="#ffffff"
                  fontSize={12}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={12}
                  domain={[0, 100]}
                  tick={{ fill: '#ffffff' }}
                  axisLine={{ stroke: '#ffffff' }}
                  tickLine={{ stroke: '#ffffff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: '#ffffff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stochK"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="stochD"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                {/* Stochastic levels */}
                <Line
                  type="monotone"
                  dataKey={() => 80}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => 20}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">Showing {chartData.length} data points</div>
        <div className="flex gap-2">
          {zoomDomain && (
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>

      {/* Main Combined Price & Volume Chart */}
      {renderMainChart()}

      {/* Oscillator Charts */}
      {renderOscillatorCharts()}
    </div>
  );
};

export default StockChart;
