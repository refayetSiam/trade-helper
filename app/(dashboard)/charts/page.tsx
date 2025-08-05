'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Volume2,
  Settings,
  Download,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StockChart from '@/components/shared/stock-chart';
import PatternEvidencePanel from '@/components/shared/pattern-evidence-panel';
import PatternDefinitions from '@/components/shared/pattern-definitions';
import {
  ChartDataService,
  ChartDataPoint,
  TechnicalIndicators,
  TimeRange,
  ChartType,
  DataFreshnessInfo,
} from '@/lib/services/chart-data';
import { DetectedPattern } from '@/lib/services/pattern-detection';
import DataFreshnessIndicator from '@/components/shared/data-freshness-indicator';
import PatternLegend from '@/components/shared/pattern-legend';
import toast from 'react-hot-toast';

interface IndicatorOption {
  id: string;
  name: string;
  description: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume';
}

const INDICATOR_OPTIONS: IndicatorOption[] = [
  // Trend Indicators
  {
    id: 'sma20',
    name: 'SMA 20',
    description: '20-period Simple Moving Average',
    category: 'trend',
  },
  {
    id: 'sma50',
    name: 'SMA 50',
    description: '50-period Simple Moving Average',
    category: 'trend',
  },
  {
    id: 'sma200',
    name: 'SMA 200',
    description: '200-period Simple Moving Average',
    category: 'trend',
  },
  {
    id: 'ema12',
    name: 'EMA 12',
    description: '12-period Exponential Moving Average',
    category: 'trend',
  },
  {
    id: 'ema26',
    name: 'EMA 26',
    description: '26-period Exponential Moving Average',
    category: 'trend',
  },
  { id: 'vwap', name: 'VWAP', description: 'Volume Weighted Average Price', category: 'trend' },

  // Momentum Indicators
  { id: 'rsi', name: 'RSI', description: 'Relative Strength Index', category: 'momentum' },
  {
    id: 'macd',
    name: 'MACD',
    description: 'Moving Average Convergence Divergence',
    category: 'momentum',
  },
  {
    id: 'stochastic',
    name: 'Stochastic',
    description: 'Stochastic Oscillator',
    category: 'momentum',
  },

  // Volatility Indicators
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    description: 'Bollinger Bands (20, 2)',
    category: 'volatility',
  },

  // Volume Indicators
  { id: 'obv', name: 'OBV', description: 'On-Balance Volume', category: 'volume' },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1 Day' },
  { value: '5D', label: '5 Days' },
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: 'YTD', label: 'Year to Date' },
  { value: '1Y', label: '1 Year' },
  { value: '2Y', label: '2 Years' },
  { value: '5Y', label: '5 Years' },
  { value: 'MAX', label: 'Max' },
];

const CHART_TYPES: { value: ChartType; label: string; icon: any }[] = [
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'area', label: 'Area', icon: Activity },
  { value: 'candlestick', label: 'Candlestick', icon: BarChart3 },
];

const ChartsPage: React.FC = () => {
  // State
  const [symbol, setSymbol] = useState('AAPL');
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['sma20', 'sma50']);
  const [indicators, setIndicators] = useState<TechnicalIndicators>({});
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [patternTypes, setPatternTypes] = useState<string[]>([
    'candlestick',
    'combination',
    'confluence',
    'swing_strategy',
  ]);
  const [swingTradingMode, setSwingTradingMode] = useState(false);
  const [intradayMode, setIntradayMode] = useState(false);
  const [showPatternDefinitions, setShowPatternDefinitions] = useState(false);
  const [showPatternLegend, setShowPatternLegend] = useState(false);
  const [dataFreshness, setDataFreshness] = useState<DataFreshnessInfo | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // Fetch chart data with freshness info - MANUAL TRIGGER ONLY
  const {
    data: chartResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chartData', symbol, timeRange],
    queryFn: () => ChartDataService.fetchChartData(symbol, timeRange),
    enabled: false, // Disable auto-fetch to prevent excessive API calls
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartData = chartResult?.data;
  const freshness = chartResult?.freshness;

  // Calculate indicators and update freshness when data changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const calculatedIndicators = ChartDataService.calculateAllIndicators(chartData);
      setIndicators(calculatedIndicators);
    }
    if (freshness) {
      setDataFreshness(freshness);
      // Show freshness warnings using appropriate toast methods
      if (freshness.isStale && freshness.warningMessage) {
        if (freshness.daysBehind <= 7) {
          toast(freshness.warningMessage, { icon: '⚠️' });
        } else {
          toast.error(freshness.warningMessage);
        }
      }
    }
  }, [chartData, freshness]);

  const handleSearch = () => {
    if (!symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }
    refetch();
    toast.loading(`Loading chart for ${symbol.toUpperCase()}...`);
  };

  const handleIndicatorToggle = (indicatorId: string, checked: boolean) => {
    setSelectedIndicators(prev =>
      checked ? [...prev, indicatorId] : prev.filter(id => id !== indicatorId)
    );
  };

  const handlePatternClick = (pattern: DetectedPattern) => {
    setSelectedPattern(pattern);
  };

  const handleClosePatternPanel = () => {
    setSelectedPattern(null);
  };

  const handlePatternTypeToggle = (patternType: string, checked: boolean) => {
    setPatternTypes(prev =>
      checked ? [...prev, patternType] : prev.filter(type => type !== patternType)
    );
  };

  const handleExportData = () => {
    if (!chartData || chartData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Add freshness warning to export
    if (dataFreshness?.isStale) {
      toast('Exported data may be delayed - ' + dataFreshness.warningMessage, { icon: '⚠️' });
    }

    // Create CSV content
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];

    // Add selected indicator headers
    selectedIndicators.forEach(id => {
      const indicator = INDICATOR_OPTIONS.find(opt => opt.id === id);
      if (indicator) headers.push(indicator.name);
    });

    const csvContent = [
      headers.join(','),
      ...chartData.map((point, index) => {
        const row = [
          point.date.toISOString().split('T')[0],
          point.open,
          point.high,
          point.low,
          point.close,
          point.volume,
        ];

        // Add indicator values
        selectedIndicators.forEach(id => {
          let value = '';
          switch (id) {
            case 'rsi':
              value = indicators.rsi?.[index]?.toFixed(2) || '';
              break;
            case 'sma20':
              value = indicators.sma?.sma20?.[index]?.toFixed(2) || '';
              break;
            case 'sma50':
              value = indicators.sma?.sma50?.[index]?.toFixed(2) || '';
              break;
            case 'sma200':
              value = indicators.sma?.sma200?.[index]?.toFixed(2) || '';
              break;
            case 'macd':
              value = indicators.macd?.macd[index]?.toFixed(4) || '';
              break;
            // Add more indicators as needed
          }
          row.push(value);
        });

        return row.join(',');
      }),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}_chart_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Chart data exported successfully');
  };

  const currentPrice =
    chartData && chartData.length > 0 ? chartData[chartData.length - 1].close : null;
  const previousPrice =
    chartData && chartData.length > 1 ? chartData[chartData.length - 2].close : null;
  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : null;
  const priceChangePercent =
    priceChange && previousPrice ? (priceChange / previousPrice) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Advanced Charts
          </h1>
          <p className="text-muted-foreground mt-1">
            Professional charting with technical indicators and analysis tools
          </p>
        </div>

        {currentPrice && (
          <div className="text-right">
            <div className="text-2xl font-bold">{symbol.toUpperCase()}</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">${currentPrice.toFixed(2)}</span>
              {priceChange && (
                <Badge
                  variant={priceChange >= 0 ? 'default' : 'destructive'}
                  className={priceChange >= 0 ? 'bg-green-100 text-green-800' : ''}
                >
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}(
                  {priceChangePercent
                    ? `${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`
                    : ''}
                  )
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chart Controls</CardTitle>
          <CardDescription>Configure your chart display and analysis settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Symbol Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter symbol (e.g., AAPL)"
                  className="pl-10"
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Time Range</label>
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Chart Type</label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                disabled={isLoading || !symbol.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Load Chart
              </Button>
              <Button
                onClick={handleExportData}
                variant="outline"
                disabled={!chartData || chartData.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading chart data</span>
            </div>
            <p className="text-red-600 mt-1 text-sm">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div
        className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
          isRightPanelCollapsed ? 'xl:grid-cols-1' : 'xl:grid-cols-4'
        }`}
      >
        {/* Chart Area */}
        <div className={`relative ${isRightPanelCollapsed ? 'xl:col-span-1' : 'xl:col-span-3'}`}>
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
            title={isRightPanelCollapsed ? 'Show Settings Panel' : 'Hide Settings Panel'}
          >
            {isRightPanelCollapsed ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chart data...</p>
              </CardContent>
            </Card>
          ) : chartData && chartData.length > 0 ? (
            <StockChart
              data={chartData}
              indicators={indicators}
              chartType={chartType}
              selectedIndicators={selectedIndicators}
              symbol={symbol}
              onPatternClick={handlePatternClick}
              patternsEnabled={patternTypes.length > 0 || swingTradingMode || intradayMode}
              patternTypes={patternTypes}
              swingTradingMode={swingTradingMode}
              intradayMode={intradayMode}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-3">Ready to Chart</h3>
                <p className="text-muted-foreground mb-6">
                  Enter a stock symbol and click "Load Chart" to start analyzing with advanced
                  technical indicators.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Panel */}
        <div
          className={`space-y-4 transition-all duration-300 ${
            isRightPanelCollapsed ? 'hidden xl:hidden' : 'block'
          }`}
        >
          {/* Technical Indicators */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Technical Indicators
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIndicators(INDICATOR_OPTIONS.map(i => i.id))}
                    className="h-7 px-2 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIndicators([])}
                    className="h-7 px-2 text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="trend" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="trend">Trend</TabsTrigger>
                  <TabsTrigger value="momentum">Momentum</TabsTrigger>
                  <TabsTrigger value="volatility">Volatility</TabsTrigger>
                  <TabsTrigger value="volume">Volume</TabsTrigger>
                </TabsList>

                {['trend', 'momentum', 'volatility', 'volume'].map(category => (
                  <TabsContent key={category} value={category} className="space-y-3 mt-4">
                    {INDICATOR_OPTIONS.filter(indicator => indicator.category === category).map(
                      indicator => (
                        <div key={indicator.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={indicator.id}
                            checked={selectedIndicators.includes(indicator.id)}
                            onCheckedChange={checked =>
                              handleIndicatorToggle(indicator.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={indicator.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {indicator.name}
                            </label>
                            <p className="text-xs text-muted-foreground">{indicator.description}</p>
                          </div>
                        </div>
                      )
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Pattern Detection Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Pattern Detection
                  </CardTitle>
                  <CardDescription>
                    Algo-powered pattern recognition with probability analysis
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatternLegend(true)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span className="hidden sm:inline">Pattern </span>Codes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPatternDefinitions(true)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <HelpCircle className="h-3 w-3" />
                    <span className="hidden sm:inline">Learn </span>More
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Swing Trading Mode Toggle */}
                <div className="p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="swing-trading-mode"
                          checked={swingTradingMode}
                          onCheckedChange={checked => {
                            setSwingTradingMode(checked as boolean);
                            if (checked) setIntradayMode(false); // Disable intraday mode
                          }}
                          className="border-blue-500 data-[state=checked]:bg-blue-600"
                        />
                        <label
                          htmlFor="swing-trading-mode"
                          className="text-sm font-semibold text-blue-200 cursor-pointer"
                        >
                          2-3 Day Swing Trading Mode
                        </label>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-800/50 text-blue-200 text-xs border-blue-600"
                      >
                        EXCLUSIVE
                      </Badge>
                    </div>
                    {swingTradingMode && (
                      <Badge
                        variant="outline"
                        className="bg-green-900/30 text-green-300 border-green-600"
                      >
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-blue-300 mt-2 ml-5">
                    {swingTradingMode
                      ? 'All other patterns disabled. Showing only high-probability swing trades with trend + volume + momentum + price action confirmation.'
                      : 'Enable to show only comprehensive swing trading signals with ATR-based stop loss & take profit levels. Disables all other pattern types.'}
                  </p>
                </div>

                {/* Intraday Gap-Up Breakout Mode Toggle */}
                <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="intraday-mode"
                          checked={intradayMode}
                          onCheckedChange={checked => {
                            setIntradayMode(checked as boolean);
                            if (checked) setSwingTradingMode(false); // Disable swing mode
                          }}
                          className="border-green-500 data-[state=checked]:bg-green-600"
                        />
                        <label
                          htmlFor="intraday-mode"
                          className="text-sm font-semibold text-green-200 cursor-pointer"
                        >
                          Intraday Gap-Up Breakout Mode
                        </label>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-800/50 text-green-200 text-xs border-green-600"
                      >
                        NEW
                      </Badge>
                    </div>
                    {intradayMode && (
                      <Badge
                        variant="outline"
                        className="bg-orange-900/30 text-orange-300 border-orange-600"
                      >
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-green-300 mt-2 ml-5">
                    {intradayMode
                      ? 'Intraday gap-up breakout signals active. Identifies morning gaps >0.5% with volume confirmation, MA alignment, and favorable risk-reward ratios.'
                      : 'Enable to detect intraday gap-up breakout opportunities with 72% historical win rate. Best for 5M-1H timeframes with volume confirmation.'}
                  </p>
                </div>

                {/* Other Algos Control Buttons - Always Visible */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Other Algos</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPatternTypes([
                          'candlestick',
                          'combination',
                          'confluence',
                          'swing_strategy',
                        ])
                      }
                      className="h-7 px-2 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPatternTypes([])}
                      className="h-7 px-2 text-xs"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Other Algos Section - Always Visible */}
                <div
                  className={`space-y-3 ${swingTradingMode || intradayMode ? 'opacity-50' : ''}`}
                >
                  <div className="space-y-3">
                    {/* Candlestick Patterns */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="candlestick-patterns"
                        checked={patternTypes.includes('candlestick')}
                        onCheckedChange={checked =>
                          handlePatternTypeToggle('candlestick', checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="candlestick-patterns"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Candlestick Patterns
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Bullish/Bearish Engulfing, Hammer, Shooting Star, Doji (Swing Trading)
                        </p>
                      </div>
                    </div>

                    {/* Combination Patterns */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="combination-patterns"
                        checked={patternTypes.includes('combination')}
                        onCheckedChange={checked =>
                          handlePatternTypeToggle('combination', checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="combination-patterns"
                          className="text-sm font-medium cursor-pointer"
                        >
                          High-Probability Combinations
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Golden Cross + Pullback, Breakout + Volume, Support/Resistance + Patterns
                        </p>
                      </div>
                    </div>

                    {/* Confluence Patterns */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="confluence-patterns"
                        checked={patternTypes.includes('confluence')}
                        onCheckedChange={checked =>
                          handlePatternTypeToggle('confluence', checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="confluence-patterns"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Confluence Analysis
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Multiple factor confirmation (Pattern + Support/Resistance + Volume)
                        </p>
                      </div>
                    </div>

                    {/* Swing Strategy */}
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="swing-strategy"
                        checked={patternTypes.includes('swing_strategy')}
                        onCheckedChange={checked =>
                          handlePatternTypeToggle('swing_strategy', checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="swing-strategy"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Triple Confirmation Bounce 🎯
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Complete swing trade strategy: Uptrend + Support + Momentum (5-15 day
                          holds)
                        </p>
                      </div>
                    </div>

                    {/* Algorithm Info */}
                    <div className="bg-muted/30 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-xs">
                          <strong>How it works:</strong> Our algorithms analyze candlestick
                          formations, support/resistance levels, volume patterns, and moving average
                          relationships to identify high-probability trading setups. Each pattern
                          includes historical win rates and risk/reward ratios.
                        </div>
                      </div>
                    </div>

                    {/* Note about mode interaction */}
                    {(swingTradingMode || intradayMode) && (
                      <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted/20 rounded">
                        <strong>Note:</strong> Other algorithms are available but may not show
                        results while exclusive trading modes are active.
                      </div>
                    )}
                  </div>
                </div>

                {/* Swing Trading Mode Info - Temporarily Simplified */}
                {swingTradingMode && (
                  <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-200 mb-2">
                      Enhanced Swing Trading Algorithm Active
                    </h4>
                    <p className="text-xs text-green-300">
                      Algorithm is analyzing trend, volume, momentum, and price action for
                      high-probability swing trades.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Market Info */}
          {chartData && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span className="font-mono">
                    ${chartData[chartData.length - 1].open.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High:</span>
                  <span className="font-mono text-green-600">
                    ${chartData[chartData.length - 1].high.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low:</span>
                  <span className="font-mono text-red-600">
                    ${chartData[chartData.length - 1].low.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume:</span>
                  <span className="font-mono">
                    {chartData[chartData.length - 1].volume.toLocaleString()}
                  </span>
                </div>

                {/* Technical Indicator Values */}
                {selectedIndicators.includes('rsi') && indicators.rsi && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">RSI (14):</span>
                    <span className="font-mono">
                      {indicators.rsi[indicators.rsi.length - 1]?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pattern Evidence Panel */}
      <PatternEvidencePanel pattern={selectedPattern} onClose={handleClosePatternPanel} />

      {/* Pattern Legend Modal */}
      <PatternLegend isOpen={showPatternLegend} onClose={() => setShowPatternLegend(false)} />

      {/* Pattern Definitions Modal */}
      <PatternDefinitions
        isOpen={showPatternDefinitions}
        onClose={() => setShowPatternDefinitions(false)}
      />
    </div>
  );
};

export default ChartsPage;
