'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Download, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import OptionsTable, { OptionData, SortConfig } from '@/components/shared/options-table';
import FilterPanel, { FilterValues, ValidationErrors } from '@/components/shared/filter-panel';
import Pagination from '@/components/shared/pagination';
import toast from 'react-hot-toast';
import { OptionsChainData, OptionContract } from '@/lib/services/yahoo-finance';
import {
  greeksCalculatorService,
  CoveredCallAnalysis,
  BlackScholesInputs,
} from '@/lib/services/greeks-calculator';
import { dataProvider } from '@/lib/services/data-provider';

interface CoveredCallData extends OptionData {
  id: string;
  symbol: string;
}

interface RecommendationAlgorithm {
  id: string;
  name: string;
  description: string;
  focus: string;
}

const ALGORITHMS: RecommendationAlgorithm[] = [
  {
    id: 'high_profit',
    name: 'High Profit',
    description: 'Maximizes absolute profit potential while maintaining reasonable risk',
    focus: 'Best net profit after borrowing costs',
  },
  {
    id: 'high_return',
    name: 'High Return',
    description: 'Targets highest annualized return percentage',
    focus: 'Maximum percentage returns',
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk with steady returns and high probability of success',
    focus: 'Capital preservation with income',
  },
  {
    id: 'high_volume',
    name: 'High Volume',
    description: 'Prioritizes liquid options with high trading volume',
    focus: 'Easy entry and exit liquidity',
  },
];

const CoveredCallsPage: React.FC = () => {
  // Basic state
  const [ticker, setTicker] = useState('');
  const [locRate, setLocRate] = useState(7.1);
  const [activeTab, setActiveTab] = useState<'all' | 'recommendations'>('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('high_profit');

  // Data state
  const [optionsData, setOptionsData] = useState<CoveredCallData[]>([]);
  const [recommendations, setRecommendations] = useState<CoveredCallData[]>([]);
  const [stockPrice, setStockPrice] = useState<number | undefined>();

  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    timeMin: '',
    timeMax: '',
    strikeMin: '',
    strikeMax: '',
    volumeMin: '',
    volumeMax: '',
    oiMin: '',
    oiMax: '',
    profitability: 'all',
    ivMin: '',
    ivMax: '',
    returnMin: '',
    returnMax: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch options chain data via API route
  const {
    data: optionsChainData,
    isLoading: isLoadingChain,
    error: chainError,
    refetch: refetchChain,
  } = useQuery({
    queryKey: ['optionsChain', ticker],
    queryFn: async () => {
      // Skip if no ticker is provided
      if (!ticker || ticker.trim() === '') {
        return null;
      }

      console.log(`📡 Fetching options via API for: ${ticker}`);

      try {
        const refreshParam = Math.random() > 0.5 ? '&refresh=true' : ''; // Force refresh sometimes
        const response = await fetch(
          `/api/options?symbol=${encodeURIComponent(ticker.toUpperCase())}${refreshParam}`
        );

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use the default error message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ Options data received via Polygon API:', data);
        toast.dismiss(); // Dismiss loading toast
        return data;
      } catch (error) {
        console.error('❌ Polygon API fetch error:', error);
        toast.dismiss(); // Dismiss loading toast

        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error(
            'Network error: Unable to connect to the server. Please check if the server is running.'
          );
        }

        throw error;
      }
    },
    enabled: !!ticker && ticker.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries for faster feedback
  });

  // Process options data when chain data is available
  useEffect(() => {
    if (optionsChainData) {
      console.log('📊 Processing options chain data:', optionsChainData);
      setStockPrice(optionsChainData.quote.regularMarketPrice);
      processOptionsData(optionsChainData);
    }
  }, [optionsChainData, locRate]);

  const processOptionsData = async (chainData: OptionsChainData) => {
    try {
      console.log('🔧 Starting to process options data...');
      console.log(`📈 Stock price: $${chainData.quote.regularMarketPrice}`);
      console.log(`📅 Expiration dates: ${chainData.options.length}`);

      const allOptions: CoveredCallData[] = [];
      const riskFreeRate = greeksCalculatorService.getRiskFreeRate();
      console.log(`📊 Risk-free rate: ${riskFreeRate * 100}%`);

      for (const expiry of chainData.options) {
        const expirationDate = new Date(expiry.expirationDate * 1000);
        const timeToExpiry = greeksCalculatorService.calculateTimeToExpiry(expirationDate);

        for (const call of expiry.calls) {
          try {
            // Use bid/ask midpoint for more accurate pricing
            // If bid/ask not available, fall back to lastPrice
            let optionPrice = call.lastPrice;
            if (call.bid && call.ask && call.bid > 0 && call.ask > 0) {
              optionPrice = (call.bid + call.ask) / 2;
            }

            // Calculate implied volatility from market price
            let impliedVol = greeksCalculatorService.calculateImpliedVolatility(
              optionPrice,
              chainData.quote.regularMarketPrice,
              call.strike,
              timeToExpiry,
              riskFreeRate,
              'call'
            );

            // Additional safety check for IV
            if (!isFinite(impliedVol) || impliedVol > 5) {
              impliedVol = 0.3; // Default to 30% if calculation fails
              console.warn(
                `IV calculation produced extreme value for ${call.contractSymbol}, using default 30%`
              );
            }

            // Prepare inputs for analysis
            const inputs: BlackScholesInputs = {
              stockPrice: chainData.quote.regularMarketPrice,
              strikePrice: call.strike,
              timeToExpiry,
              riskFreeRate,
              volatility: impliedVol,
              dividendYield: (chainData.quote.dividendYield || 0) / 100,
            };

            // Calculate Greeks
            const greeks = greeksCalculatorService.calculateGreeks(inputs, 'call');

            // Analyze covered call opportunity
            const analysis = greeksCalculatorService.analyzeCoveredCall(
              inputs,
              locRate,
              optionPrice
            );

            const optionData: CoveredCallData = {
              id: call.contractSymbol,
              symbol: chainData.quote.symbol,
              contractSymbol: call.contractSymbol,
              expiry: expirationDate.toLocaleDateString(),
              strike: call.strike,
              optionPrice: optionPrice, // Use the bid/ask midpoint we calculated
              volume: call.volume || 0,
              openInterest: call.openInterest || 0,
              impliedVolatility: impliedVol,
              costOfBorrowing: analysis.costOfBorrowing,
              netProfit: analysis.netProfit,
              annualizedReturn: analysis.annualizedReturn,
              breakeven: analysis.breakeven,
              daysToExpiry: analysis.daysToExpiry,
              delta: greeks.delta,
              theta: greeks.theta,
              gamma: greeks.gamma,
              vega: greeks.vega,
              rho: greeks.rho,
              maxProfit: analysis.maxProfit,
              maxLoss: analysis.maxLoss,
              probabilityOfProfit: analysis.probabilityOfProfit,
            };

            allOptions.push(optionData);
          } catch (error) {
            console.warn(`Error processing option ${call.contractSymbol}:`, error);
          }
        }
      }

      setOptionsData(allOptions);
      toast.success(`✅ Analyzed ${allOptions.length} covered call opportunities`);
    } catch (error) {
      console.error('Error processing options data:', error);
      toast.error('Failed to analyze options data');
    }
  };

  const handleAnalyze = () => {
    if (!ticker) {
      toast.error('Please enter a ticker symbol');
      return;
    }

    // Basic validation
    if (ticker.length < 1 || ticker.length > 5) {
      toast.error('Please enter a valid ticker symbol (1-5 characters)');
      return;
    }

    // Common symbols that don't have options
    const symbolsWithoutOptions = ['AMDF', 'AAMDF'];
    if (symbolsWithoutOptions.includes(ticker.toUpperCase())) {
      toast.error(
        `${ticker.toUpperCase()} does not have options trading available. Try symbols like AAPL, MSFT, TSLA, SPY instead.`
      );
      return;
    }

    // The query will automatically run when ticker changes
  };

  const handleRefreshOptions = async () => {
    if (!ticker) {
      toast.error('Please enter a ticker symbol');
      return;
    }

    // Toggle data source for refresh
    const currentConfig = dataProvider.getConfig();
    const newSource = currentConfig.primarySource === 'source1' ? 'source2' : 'source1';
    dataProvider.setDataSource(newSource);

    toast.loading(
      `Refreshing options using ${newSource === 'source1' ? 'Source 1' : 'Fallback API'}...`
    );

    try {
      await refetchChain();
      toast.dismiss();
      toast.success(
        `Options refreshed using ${newSource === 'source1' ? 'Source 1' : 'Fallback API'}`
      );
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to refresh options');
    } finally {
      // Optionally switch back to original source
      // dataProvider.setDataSource(currentConfig.primarySource);
    }
  };

  // Generate recommendations based on selected algorithm
  const generateRecommendations = () => {
    if (optionsData.length === 0) {
      toast.error('No options data available for recommendations');
      return;
    }

    let filtered = [...optionsData];

    // Apply basic filters for recommendations
    filtered = filtered.filter(
      option =>
        option.volume >= 50 &&
        option.openInterest >= 100 &&
        option.daysToExpiry >= 7 &&
        option.daysToExpiry <= 120
    );

    // Apply algorithm-specific logic
    switch (selectedAlgorithm) {
      case 'high_profit':
        filtered = filtered
          .filter(option => option.netProfit > 0)
          .sort((a, b) => b.netProfit - a.netProfit)
          .slice(0, 20);
        break;

      case 'high_return':
        filtered = filtered
          .filter(option => option.annualizedReturn > 5)
          .sort((a, b) => b.annualizedReturn - a.annualizedReturn)
          .slice(0, 20);
        break;

      case 'conservative':
        filtered = filtered
          .filter(
            option =>
              option.netProfit > 0 &&
              option.annualizedReturn > 3 &&
              option.annualizedReturn < 25 &&
              (option.probabilityOfProfit || 0) > 60
          )
          .sort((a, b) => (b.probabilityOfProfit || 0) - (a.probabilityOfProfit || 0))
          .slice(0, 20);
        break;

      case 'high_volume':
        filtered = filtered
          .filter(option => option.volume >= 100 && option.openInterest >= 500)
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 20);
        break;
    }

    setRecommendations(filtered);
    toast.success(
      `✅ Generated ${filtered.length} recommendations using ${ALGORITHMS.find(a => a.id === selectedAlgorithm)?.name} algorithm`
    );
  };

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    const sourceData = activeTab === 'all' ? optionsData : recommendations;
    let filtered = [...sourceData];

    // Apply filters
    if (filters.timeMin) {
      filtered = filtered.filter(opt => opt.daysToExpiry >= parseFloat(filters.timeMin));
    }
    if (filters.timeMax) {
      filtered = filtered.filter(opt => opt.daysToExpiry <= parseFloat(filters.timeMax));
    }
    if (filters.strikeMin) {
      filtered = filtered.filter(opt => opt.strike >= parseFloat(filters.strikeMin));
    }
    if (filters.strikeMax) {
      filtered = filtered.filter(opt => opt.strike <= parseFloat(filters.strikeMax));
    }
    if (filters.volumeMin) {
      filtered = filtered.filter(opt => opt.volume >= parseFloat(filters.volumeMin));
    }
    if (filters.volumeMax) {
      filtered = filtered.filter(opt => opt.volume <= parseFloat(filters.volumeMax));
    }
    if (filters.oiMin) {
      filtered = filtered.filter(opt => opt.openInterest >= parseFloat(filters.oiMin));
    }
    if (filters.oiMax) {
      filtered = filtered.filter(opt => opt.openInterest <= parseFloat(filters.oiMax));
    }
    if (filters.ivMin) {
      filtered = filtered.filter(opt => opt.impliedVolatility * 100 >= parseFloat(filters.ivMin));
    }
    if (filters.ivMax) {
      filtered = filtered.filter(opt => opt.impliedVolatility * 100 <= parseFloat(filters.ivMax));
    }
    if (filters.returnMin) {
      filtered = filtered.filter(opt => opt.annualizedReturn >= parseFloat(filters.returnMin));
    }
    if (filters.returnMax) {
      filtered = filtered.filter(opt => opt.annualizedReturn <= parseFloat(filters.returnMax));
    }
    if (filters.profitability === 'profitable') {
      filtered = filtered.filter(opt => opt.netProfit > 0);
    }
    if (filters.profitability === 'unprofitable') {
      filtered = filtered.filter(opt => opt.netProfit <= 0);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (sortConfig.key === 'expiry') {
          const aDate = new Date(aVal as string).getTime();
          const bDate = new Date(bVal as string).getTime();
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return filtered;
  }, [optionsData, recommendations, filters, sortConfig, activeTab]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, ticker]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headers = [
      'Symbol',
      'Expiry',
      'Strike',
      'Option Price',
      'Volume',
      'Open Interest',
      'IV (%)',
      'Cost of Borrowing',
      'Net Profit',
      'Annual Return (%)',
      'Breakeven',
      'Days to Expiry',
      'Delta',
      'Theta',
      'Max Profit',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row =>
        [
          row.symbol,
          row.expiry,
          row.strike,
          row.optionPrice,
          row.volume,
          row.openInterest,
          (row.impliedVolatility * 100).toFixed(1),
          row.costOfBorrowing,
          row.netProfit,
          row.annualizedReturn.toFixed(2),
          row.breakeven,
          row.daysToExpiry,
          row.delta?.toFixed(4) || '',
          row.theta?.toFixed(4) || '',
          row.maxProfit || '',
        ].join(',')
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `covered_calls_${ticker}_USD_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('✅ CSV exported successfully');
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Covered Call Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">
            Advanced options analysis with LOC-based covered call strategies
          </p>
        </div>
        {stockPrice && (
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{ticker.toUpperCase()}</div>
            <div className="text-lg font-semibold text-blue-600">{formatCurrency(stockPrice)}</div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Analysis</CardTitle>
          <CardDescription>
            Enter a ticker symbol to analyze covered call opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Stock Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  placeholder="Enter ticker (e.g., AAPL)"
                  className="pl-10 text-lg font-semibold"
                  onKeyPress={e => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={isLoadingChain || !ticker.trim()}
                size="lg"
                className="flex items-center gap-2"
              >
                {isLoadingChain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Analyze Options
              </Button>

              {optionsData.length > 0 && (
                <Button
                  onClick={handleRefreshOptions}
                  disabled={isLoadingChain}
                  size="lg"
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Refresh options data using alternate data source (switches between Source 1 and Fallback API)"
                >
                  {isLoadingChain ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {chainError && ticker && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading options data</span>
            </div>
            <p className="text-red-600 mt-1 text-sm">{(chainError as Error).message}</p>
            {(chainError as Error).message.includes('Network error') && (
              <p className="text-red-600 mt-2 text-sm">
                Make sure the development server is running with:{' '}
                <code className="bg-red-100 px-1 py-0.5 rounded">npm run dev</code>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {(optionsData.length > 0 || recommendations.length > 0) && (
        <>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as 'all' | 'recommendations')}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All Options ({optionsData.length})
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-2">
                  Recommendations ({recommendations.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {activeTab === 'recommendations' && (
                  <>
                    <select
                      value={selectedAlgorithm}
                      onChange={e => setSelectedAlgorithm(e.target.value)}
                      className="px-3 py-1 border border-input rounded-lg text-sm bg-background"
                    >
                      {ALGORITHMS.map(algo => (
                        <option key={algo.id} value={algo.id}>
                          {algo.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={generateRecommendations}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Generate
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Algorithm Info */}
            {activeTab === 'recommendations' && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {ALGORITHMS.find(a => a.id === selectedAlgorithm)?.name} Algorithm
                      </h4>
                      <p className="text-blue-700 text-sm mt-1">
                        {ALGORITHMS.find(a => a.id === selectedAlgorithm)?.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                        Focus: {ALGORITHMS.find(a => a.id === selectedAlgorithm)?.focus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <TabsContent value="all" className="space-y-4">
              {/* Filter Panel */}
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                validationErrors={validationErrors}
                onValidationErrors={setValidationErrors}
                currentPrice={stockPrice}
                locRate={locRate}
                onLocRateChange={setLocRate}
                totalResults={filteredData.length}
              />

              {/* Options Table */}
              <OptionsTable
                data={paginatedData}
                currency="USD"
                loading={isLoadingChain}
                onSort={setSortConfig}
                showGreeks={true}
                showAdvancedMetrics={true}
              />

              {/* Enhanced Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                <>
                  {/* Filter Panel for Recommendations */}
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    validationErrors={validationErrors}
                    onValidationErrors={setValidationErrors}
                    currentPrice={stockPrice}
                    locRate={locRate}
                    onLocRateChange={setLocRate}
                    totalResults={filteredData.length}
                  />

                  {/* Recommendations Table */}
                  <OptionsTable
                    data={paginatedData}
                    currency="USD"
                    onSort={setSortConfig}
                    showGreeks={true}
                    showAdvancedMetrics={true}
                  />

                  {/* Enhanced Pagination for Recommendations */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-muted-foreground mb-4">
                      <TrendingUp className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      No Recommendations Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Generate algorithmic recommendations based on your selected strategy.
                    </p>
                    <Button
                      onClick={generateRecommendations}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Generate Recommendations
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!isLoadingChain && optionsData.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Ready to Analyze</h3>
            <p className="text-muted-foreground mb-6">
              Enter a stock ticker above to start analyzing covered call opportunities with advanced
              Greeks calculations and LOC-based analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoveredCallsPage;
