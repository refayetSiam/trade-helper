'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import PatternConfigurationDrawer from '@/components/shared/pattern-configuration-drawer';
import StockPriceHeader from '@/components/shared/stock-price-header';
import { priceService } from '@/lib/services/price-service';
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
import { useTradingStore, useCurrentSymbol, useSetCurrentSymbol } from '@/lib/stores/trading-store';
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
  // Use shared store for symbol
  const currentSymbol = useCurrentSymbol();
  const setCurrentSymbol = useSetCurrentSymbol();
  const tradingStore = useTradingStore();

  // Initialize symbol if empty
  const symbol = currentSymbol || 'AAPL';

  useEffect(() => {
    if (!currentSymbol) {
      setCurrentSymbol('AAPL');
    }
  }, [currentSymbol, setCurrentSymbol]);

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
  const [showPatternLegend, setShowPatternLegend] = useState(false);
  const [showPatternDrawer, setShowPatternDrawer] = useState(false);
  const [dataFreshness, setDataFreshness] = useState<DataFreshnessInfo | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMarketDataCollapsed, setIsMarketDataCollapsed] = useState(false);
  const [isIndicatorsCollapsed, setIsIndicatorsCollapsed] = useState(false);

  // Consistent price data (always based on recent timeframe, not chart timeframe)
  const [consistentPriceData, setConsistentPriceData] = useState<{
    currentPrice: number | null;
    priceChange: number | null;
    priceChangePercent: number | null;
  }>({
    currentPrice: null,
    priceChange: null,
    priceChangePercent: null,
  });

  // Check cache first, then fetch if needed
  const {
    data: chartResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chartData', symbol, timeRange],
    queryFn: async () => {
      // Check if we have cached data first
      const cachedData = tradingStore.getCacheData('chart', symbol, { timeRange });
      if (cachedData && tradingStore.isCacheValid('chart', symbol, 5 * 60 * 1000, { timeRange })) {
        return { data: cachedData.data, freshness: null };
      }
      const result = await ChartDataService.fetchChartData(symbol, timeRange);

      // Cache the new data
      if (result?.data) {
        tradingStore.setCacheData('chart', symbol, result.data, { timeRange });
      }

      return result;
    },
    enabled: false, // Still manual trigger
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

  // Auto-load cached data when symbol changes
  useEffect(() => {
    if (symbol && tradingStore.isCacheValid('chart', symbol, 5 * 60 * 1000, { timeRange })) {
      refetch();
    }
  }, [symbol, timeRange, tradingStore, refetch]);

  // Fetch consistent price data (always based on 5D regardless of chart timerange)
  const fetchConsistentPriceData = useCallback(async (symbolToFetch: string) => {
    try {
      const priceData = await priceService.getPrimaryStockPrice(symbolToFetch, '5D');

      setConsistentPriceData({
        currentPrice: priceData.currentPrice,
        priceChange: priceData.priceChange,
        priceChangePercent: priceData.priceChangePercent,
      });
    } catch (error) {
      setConsistentPriceData({
        currentPrice: null,
        priceChange: null,
        priceChangePercent: null,
      });
    }
  }, []);

  // Note: Removed automatic symbol-triggered fetching to prevent errors on partial symbols
  // Price data is now fetched manually only via handleSearch() or when clicking Load button

  const handleSymbolChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSymbol = e.target.value.toUpperCase();
      setCurrentSymbol(newSymbol);

      // Clear price data when symbol is cleared
      if (!newSymbol.trim()) {
        setConsistentPriceData({
          currentPrice: null,
          priceChange: null,
          priceChangePercent: null,
        });
      }
    },
    [setCurrentSymbol]
  );

  const handleSearch = () => {
    if (!symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }

    // Fetch both chart data and consistent price data
    refetch();
    fetchConsistentPriceData(symbol);
    toast.loading(`Loading data for ${symbol.toUpperCase()}...`);
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
      ...chartData.map((point: ChartDataPoint, index: number) => {
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

    toast.success('Chart data exported successfully', {
      duration: 3000, // Auto-dismiss after 3 seconds for export confirmation
      position: 'top-right',
    });
  };

  // Use consistent price data for header (not dependent on chart timeframe)
  const { currentPrice, priceChange, priceChangePercent } = consistentPriceData;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Stock Price Header */}
      {currentPrice && (
        <StockPriceHeader
          symbol={symbol}
          currentPrice={currentPrice}
          priceChange={priceChange}
          priceChangePercent={priceChangePercent}
        />
      )}

      {/* Chart Controls */}
      <div className="bg-gradient-to-r from-card to-card/50 rounded-lg border shadow-sm">
        {/* Controls Bar */}
        <div className="bg-muted/20 backdrop-blur-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Symbol Input */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Symbol:</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={symbol}
                  onChange={handleSymbolChange}
                  placeholder="AAPL"
                  className="pl-8 w-24 h-8"
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Range:</label>
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-24 h-8">
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Type:</label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-28 h-8">
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

            {/* Pattern Detection Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPatternDrawer(true)}
                variant="outline"
                className="h-8 px-3"
                size="sm"
              >
                <Activity className="h-4 w-4" />
                Configure Patterns
              </Button>
              <Button
                onClick={() => setShowPatternLegend(true)}
                variant="outline"
                className="h-8 px-3"
                size="sm"
              >
                <HelpCircle className="h-4 w-4" />
                Codes
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={handleSearch}
                disabled={isLoading || !symbol.trim()}
                className="h-8 px-3"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Load
              </Button>
              <Button
                onClick={handleExportData}
                variant="outline"
                disabled={!chartData || chartData.length === 0}
                className="h-8 px-3"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Main Content - Optimized Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Chart Area - Takes most space */}
        <div
          className={`flex-1 relative transition-all duration-300 ${
            isRightPanelCollapsed ? '' : 'lg:flex-[3]'
          }`}
        >
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

        {/* Compact Settings Panel */}
        <div
          className={`w-full lg:w-80 space-y-3 transition-all duration-300 ${
            isRightPanelCollapsed ? 'hidden lg:hidden' : 'block'
          }`}
        >
          {/* Compact Technical Indicators */}
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Indicators ({selectedIndicators.length})
                </CardTitle>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIndicators(INDICATOR_OPTIONS.map(i => i.id))}
                    className="h-6 px-2 text-xs transition-all duration-200 hover:scale-105"
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIndicators([])}
                    className="h-6 px-2 text-xs transition-all duration-200 hover:scale-105"
                  >
                    None
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsIndicatorsCollapsed(!isIndicatorsCollapsed)}
                    className="h-6 w-6 p-0 hover:bg-muted/80 transition-all duration-300"
                  >
                    <span
                      className={`text-xs transition-transform duration-300 ${
                        isIndicatorsCollapsed ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      ⌄
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  !isIndicatorsCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div
                  className={`transition-all duration-300 delay-100 ${
                    !isIndicatorsCollapsed
                      ? 'opacity-100 transform translate-y-0'
                      : 'opacity-0 transform -translate-y-2'
                  }`}
                >
                  <Tabs defaultValue="trend" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-8 mb-3">
                      <TabsTrigger value="trend" className="text-xs transition-all duration-200">
                        Trend
                      </TabsTrigger>
                      <TabsTrigger value="momentum" className="text-xs transition-all duration-200">
                        Momentum
                      </TabsTrigger>
                      <TabsTrigger
                        value="volatility"
                        className="text-xs transition-all duration-200"
                      >
                        Vol
                      </TabsTrigger>
                      <TabsTrigger value="volume" className="text-xs transition-all duration-200">
                        Volume
                      </TabsTrigger>
                    </TabsList>

                    {['trend', 'momentum', 'volatility', 'volume'].map(category => (
                      <TabsContent key={category} value={category} className="space-y-2 mt-0">
                        {INDICATOR_OPTIONS.filter(indicator => indicator.category === category).map(
                          (indicator, idx) => (
                            <div
                              key={indicator.id}
                              className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <Checkbox
                                id={indicator.id}
                                checked={selectedIndicators.includes(indicator.id)}
                                onCheckedChange={checked =>
                                  handleIndicatorToggle(indicator.id, checked as boolean)
                                }
                                className="transition-all duration-200"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={indicator.id}
                                  className="text-xs font-medium cursor-pointer leading-tight group-hover:text-foreground transition-colors duration-200"
                                >
                                  {indicator.name}
                                </label>
                                <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-muted-foreground/80 transition-colors duration-200">
                                  {indicator.description}
                                </p>
                              </div>
                              {selectedIndicators.includes(indicator.id) && (
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                          )
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Info */}
          {chartData && chartData.length > 0 && (
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Market Data
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMarketDataCollapsed(!isMarketDataCollapsed)}
                    className="h-6 w-6 p-0 hover:bg-muted/80 transition-all duration-300"
                  >
                    <span
                      className={`text-xs transition-transform duration-300 ${
                        isMarketDataCollapsed ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      ⌄
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    !isMarketDataCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div
                    className={`space-y-2 text-sm transition-all duration-300 delay-100 ${
                      !isMarketDataCollapsed
                        ? 'opacity-100 transform translate-y-0'
                        : 'opacity-0 transform -translate-y-2'
                    }`}
                  >
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <span className="text-muted-foreground">Open:</span>
                      <span className="font-mono font-semibold">
                        ${chartData[chartData.length - 1].open.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <span className="text-muted-foreground">High:</span>
                      <span className="font-mono text-green-600 font-semibold">
                        ${chartData[chartData.length - 1].high.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <span className="text-muted-foreground">Low:</span>
                      <span className="font-mono text-red-600 font-semibold">
                        ${chartData[chartData.length - 1].low.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-mono font-semibold">
                        {(chartData[chartData.length - 1].volume / 1000000).toFixed(2)}M
                      </span>
                    </div>

                    {/* Technical Indicator Values */}
                    {selectedIndicators.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Indicators
                        </h5>
                        <div className="space-y-2">
                          {selectedIndicators.includes('rsi') && indicators.rsi && (
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                RSI (14):
                              </span>
                              <span
                                className={`font-mono font-semibold ${
                                  indicators.rsi[indicators.rsi.length - 1] > 70
                                    ? 'text-red-500'
                                    : indicators.rsi[indicators.rsi.length - 1] < 30
                                      ? 'text-green-500'
                                      : 'text-foreground'
                                }`}
                              >
                                {indicators.rsi[indicators.rsi.length - 1]?.toFixed(2) || 'N/A'}
                              </span>
                            </div>
                          )}

                          {selectedIndicators.includes('macd') && indicators.macd && (
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                MACD:
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                {indicators.macd.macd[indicators.macd.macd.length - 1]?.toFixed(
                                  4
                                ) || 'N/A'}
                              </span>
                            </div>
                          )}

                          {selectedIndicators.includes('sma20') && indicators.sma?.sma20 && (
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors duration-200">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                SMA 20:
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                $
                                {indicators.sma.sma20[indicators.sma.sma20.length - 1]?.toFixed(
                                  2
                                ) || 'N/A'}
                              </span>
                            </div>
                          )}

                          {selectedIndicators.includes('sma50') && indicators.sma?.sma50 && (
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors duration-200">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                SMA 50:
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                $
                                {indicators.sma.sma50[indicators.sma.sma50.length - 1]?.toFixed(
                                  2
                                ) || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pattern Evidence Panel */}
      <PatternEvidencePanel
        pattern={selectedPattern}
        onClose={handleClosePatternPanel}
        chartData={chartData}
      />

      {/* Pattern Legend Modal */}
      <PatternLegend isOpen={showPatternLegend} onClose={() => setShowPatternLegend(false)} />

      {/* Pattern Configuration Drawer */}
      <PatternConfigurationDrawer
        isOpen={showPatternDrawer}
        onClose={() => setShowPatternDrawer(false)}
        patternTypes={patternTypes}
        onPatternTypeToggle={handlePatternTypeToggle}
        swingTradingMode={swingTradingMode}
        onSwingTradingToggle={setSwingTradingMode}
        intradayMode={intradayMode}
        onIntradayToggle={setIntradayMode}
      />
    </div>
  );
};

export default ChartsPage;
