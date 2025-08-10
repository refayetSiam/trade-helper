'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  TrendingUp,
  Download,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { showDismissibleToast } from '@/components/ui/dismissible-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import OptionsTable, { OptionData, SortConfig } from '@/components/shared/options-table';
import FilterPanel, { FilterValues, ValidationErrors } from '@/components/shared/filter-panel';
import Pagination from '@/components/shared/pagination';
import StockPriceHeader from '@/components/shared/stock-price-header';
import toast from 'react-hot-toast';
import { OptionsChainData, OptionContract } from '@/lib/services/yahoo-finance';
import {
  greeksCalculatorService,
  CoveredCallAnalysis,
  BlackScholesInputs,
} from '@/lib/services/greeks-calculator';
import { dataProvider } from '@/lib/services/data-provider';
import { priceService } from '@/lib/services/price-service';
import {
  useTradingStore,
  useCurrentSymbol,
  useSetCurrentSymbol,
  useCoveredCallsFilters,
  useSetCoveredCallsFilters,
  useLocRate,
  useSetLocRate,
} from '@/lib/stores/trading-store';

interface OptionsData extends OptionData {
  id: string;
  symbol: string;
  optionType: 'call' | 'put';
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
  // Use shared store
  const currentSymbol = useCurrentSymbol();
  const setCurrentSymbol = useSetCurrentSymbol();
  const tradingStore = useTradingStore();
  const filters = useCoveredCallsFilters();
  const setFilters = useSetCoveredCallsFilters();

  // Create a wrapper function that properly updates filters
  const handleFiltersChange = useCallback(
    (newFilters: FilterValues | ((prev: FilterValues) => FilterValues)) => {
      if (typeof newFilters === 'function') {
        // Handle function-based updates
        const currentFilters = filters;
        const updatedFilters = newFilters(currentFilters);
        setFilters(updatedFilters);
      } else {
        // Handle direct object updates
        setFilters(newFilters);
      }
    },
    [setFilters, filters]
  );
  const locRate = useLocRate();
  const setLocRate = useSetLocRate();

  // Initialize symbol if empty, or use current symbol
  const ticker = currentSymbol || '';

  // Local UI state
  const [optionType, setOptionType] = useState<'calls' | 'puts'>('calls');
  const [activeTab, setActiveTab] = useState<'all' | 'recommendations'>('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('high_profit');

  // Data state
  const [callsData, setCallsData] = useState<OptionsData[]>([]);
  const [putsData, setPutsData] = useState<OptionsData[]>([]);
  const [recommendations, setRecommendations] = useState<OptionsData[]>([]);
  const [stockPrice, setStockPrice] = useState<number | undefined>();
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);

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

      // Check cache first
      const cachedData = tradingStore.getCacheData('options', ticker);
      if (cachedData && tradingStore.isCacheValid('options', ticker, 10 * 60 * 1000)) {
        // 10 minutes for options
        return cachedData.data;
      }

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

        // Cache the new data
        if (data) {
          tradingStore.setCacheData('options', ticker, data);
        }

        return data;
      } catch (error) {
        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error(
            'Network error: Unable to connect to the server. Please check if the server is running.'
          );
        }

        throw error;
      }
    },
    enabled: false, // Disabled automatic fetching - only manual via handleAnalyze()
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries for faster feedback
  });

  // Put option calculations (cash-secured puts)
  const calculatePutMetrics = useCallback(
    (
      stockPrice: number,
      strikePrice: number,
      optionPrice: number,
      daysToExpiry: number,
      locRate: number
    ) => {
      // Cash-secured put calculations
      const B_CSP = strikePrice * 100; // cash secured/borrowed capital
      const interest_CSP = B_CSP * (locRate / 100) * (daysToExpiry / 365);

      // Determine if put is currently ITM or OTM
      const isPutITM = stockPrice < strikePrice; // Put is ITM when stock price < strike

      // OTM baseline (guaranteed) - not assigned, expires worthless
      const min_profit_CSP = optionPrice * 100 - interest_CSP;

      // ITM scenario - if assigned (use current stock price as ST for calculation)
      const net_if_assigned_CSP =
        (stockPrice - strikePrice) * 100 + optionPrice * 100 - interest_CSP;

      // Choose appropriate scenario based on current moneyness
      const netProfit = isPutITM ? net_if_assigned_CSP : min_profit_CSP;
      const maxProfit = min_profit_CSP; // OTM is always the max profit scenario for puts

      // Breakeven (based on chosen scenario)
      const breakeven = isPutITM
        ? strikePrice - optionPrice + interest_CSP / 100 // ITM: assigned breakeven
        : strikePrice - optionPrice; // OTM: simple premium breakeven

      // Annualized return: Based on chosen scenario
      const annualizedReturn = (netProfit / B_CSP) * (365 / daysToExpiry) * 100;

      // Max loss: If stock goes to 0 and assigned
      const maxLoss = strikePrice * 100 - optionPrice * 100 - interest_CSP;

      // Probability of profit: Rough estimate (stock stays above breakeven)
      const distanceFromBreakeven = (stockPrice - breakeven) / stockPrice;
      const probabilityOfProfit = Math.min(Math.max(50 + distanceFromBreakeven * 30, 10), 90);

      return {
        costOfBorrowing: interest_CSP,
        maxProfit,
        breakeven,
        netProfit,
        annualizedReturn,
        maxLoss,
        probabilityOfProfit,
        daysToExpiry,
      };
    },
    []
  );

  const processOptionsData = useCallback(
    async (chainData: OptionsChainData) => {
      try {
        const allCalls: OptionsData[] = [];
        const allPuts: OptionsData[] = [];
        const riskFreeRate = greeksCalculatorService.getRiskFreeRate();

        for (const expiry of chainData.options) {
          const expirationDate = new Date(expiry.expirationDate * 1000);
          const timeToExpiry = greeksCalculatorService.calculateTimeToExpiry(expirationDate);

          // Process calls
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

              // Determine if call is ITM/OTM
              const isCallITM = chainData.quote.regularMarketPrice > call.strike;
              const callMoneyness: 'ITM' | 'OTM' | 'ATM' =
                chainData.quote.regularMarketPrice > call.strike
                  ? 'ITM'
                  : chainData.quote.regularMarketPrice < call.strike
                    ? 'OTM'
                    : 'ATM';

              const callData: OptionsData = {
                id: call.contractSymbol,
                symbol: chainData.quote.symbol,
                optionType: 'call',
                contractSymbol: call.contractSymbol,
                expiry: expirationDate.toLocaleDateString(),
                strike: call.strike,
                optionPrice: optionPrice, // Use the bid/ask midpoint we calculated
                volume: call.volume || 0,
                openInterest: call.openInterest || 0,
                impliedVolatility: impliedVol,
                isITM: isCallITM,
                moneyness: callMoneyness,
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

              allCalls.push(callData);
            } catch (error) {
              // Silently skip options that fail to process
            }
          }

          // Process puts
          for (const put of expiry.puts) {
            try {
              // Use bid/ask midpoint for more accurate pricing
              let optionPrice = put.lastPrice;
              if (put.bid && put.ask && put.bid > 0 && put.ask > 0) {
                optionPrice = (put.bid + put.ask) / 2;
              }

              // Calculate implied volatility from market price
              let impliedVol = greeksCalculatorService.calculateImpliedVolatility(
                optionPrice,
                chainData.quote.regularMarketPrice,
                put.strike,
                timeToExpiry,
                riskFreeRate,
                'put'
              );

              // Additional safety check for IV
              if (!isFinite(impliedVol) || impliedVol > 5) {
                impliedVol = 0.3; // Default to 30% if calculation fails
              }

              // Prepare inputs for Greeks calculation
              const inputs: BlackScholesInputs = {
                stockPrice: chainData.quote.regularMarketPrice,
                strikePrice: put.strike,
                timeToExpiry,
                riskFreeRate,
                volatility: impliedVol,
                dividendYield: (chainData.quote.dividendYield || 0) / 100,
              };

              // Calculate Greeks for puts
              const greeks = greeksCalculatorService.calculateGreeks(inputs, 'put');

              // Calculate put-specific metrics using cash-secured put strategy
              const putMetrics = calculatePutMetrics(
                chainData.quote.regularMarketPrice,
                put.strike,
                optionPrice,
                greeksCalculatorService.calculateTimeToExpiry(expirationDate) * 365,
                locRate
              );

              // Determine if put is ITM/OTM
              const isPutITM = chainData.quote.regularMarketPrice < put.strike;
              const putMoneyness: 'ITM' | 'OTM' | 'ATM' =
                chainData.quote.regularMarketPrice < put.strike
                  ? 'ITM'
                  : chainData.quote.regularMarketPrice > put.strike
                    ? 'OTM'
                    : 'ATM';

              const putData: OptionsData = {
                id: put.contractSymbol,
                symbol: chainData.quote.symbol,
                optionType: 'put',
                contractSymbol: put.contractSymbol,
                expiry: expirationDate.toLocaleDateString(),
                strike: put.strike,
                optionPrice: optionPrice,
                volume: put.volume || 0,
                openInterest: put.openInterest || 0,
                impliedVolatility: impliedVol,
                isITM: isPutITM,
                moneyness: putMoneyness,
                costOfBorrowing: putMetrics.costOfBorrowing,
                netProfit: putMetrics.netProfit,
                annualizedReturn: putMetrics.annualizedReturn,
                breakeven: putMetrics.breakeven,
                daysToExpiry: putMetrics.daysToExpiry,
                delta: greeks.delta,
                theta: greeks.theta,
                gamma: greeks.gamma,
                vega: greeks.vega,
                rho: greeks.rho,
                maxProfit: putMetrics.maxProfit,
                maxLoss: putMetrics.maxLoss,
                probabilityOfProfit: putMetrics.probabilityOfProfit,
              };

              allPuts.push(putData);
            } catch (error) {
              // Silently skip options that fail to process
            }
          }
        }

        setCallsData(allCalls);
        setPutsData(allPuts);
        showDismissibleToast(
          `✅ Analyzed ${allCalls.length} calls and ${allPuts.length} puts options`
        );
      } catch (error) {
        toast.error('Failed to analyze options data');
      }
    },
    [locRate]
  );

  // Fetch accurate stock price using the unified price service
  const fetchAccurateStockPrice = useCallback(async (symbol: string) => {
    try {
      const priceData = await priceService.getPrimaryStockPrice(symbol, '5D');

      setStockPrice(priceData.currentPrice);
      setPriceChange(priceData.priceChange);
      setPriceChangePercent(priceData.priceChangePercent);

      return priceData.currentPrice;
    } catch (error) {
      // Set defaults if fetch fails
      setStockPrice(undefined);
      setPriceChange(null);
      setPriceChangePercent(null);
      return null;
    }
  }, []);

  // Process options data when chain data is available
  useEffect(() => {
    if (optionsChainData && ticker) {
      // Fetch accurate stock price using the new price service
      fetchAccurateStockPrice(ticker).then(async accuratePrice => {
        if (accuratePrice) {
          // Process options data with the original quote data (for Greeks calculations)
          // but display the accurate chart-based price in the header
          processOptionsData(optionsChainData);
        } else {
          // Fallback to the original quote price if price service fails
          const fallbackPrice = optionsChainData.quote.regularMarketPrice;
          setStockPrice(fallbackPrice);
          processOptionsData(optionsChainData);
        }
      });
    }
  }, [optionsChainData, ticker, fetchAccurateStockPrice, processOptionsData]);

  // Note: Removed automatic ticker-triggered fetching to prevent errors on partial symbols
  // Options data is now fetched manually only via handleAnalyze() when user clicks "Analyze Options"

  const handleTickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentSymbol(e.target.value.toUpperCase());
    },
    [setCurrentSymbol]
  );

  const handleAlgorithmChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(e.target.value);
  }, []);

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

    // Common symbols that don't have options or are invalid
    const symbolsWithoutOptions = ['AMDF', 'AAMDF', 'TES'];
    if (symbolsWithoutOptions.includes(ticker.toUpperCase())) {
      toast.error(
        `${ticker.toUpperCase()} does not have options trading available or is an invalid symbol. Try symbols like AAPL, MSFT, TSLA, SPY instead.`
      );
      return;
    }

    // Manually trigger the options data fetch
    refetchChain();
    toast.loading(`Analyzing options for ${ticker.toUpperCase()}...`);
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

    const loadingToastId = toast.loading(
      `Refreshing options using ${newSource === 'source1' ? 'Source 1' : 'Fallback API'}...`
    );

    try {
      await refetchChain();
      toast.dismiss(loadingToastId);
      toast.success(
        `Options refreshed using ${newSource === 'source1' ? 'Source 1' : 'Fallback API'}`,
        {
          duration: 4000, // 4 seconds
          position: 'top-right',
        }
      );
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('Failed to refresh options');
    } finally {
      // Optionally switch back to original source
      // dataProvider.setDataSource(currentConfig.primarySource);
    }
  };

  // Generate recommendations based on selected algorithm
  const generateRecommendations = () => {
    const currentOptionsData = optionType === 'calls' ? callsData : putsData;
    if (currentOptionsData.length === 0) {
      toast.error(`No ${optionType} data available for recommendations`);
      return;
    }

    let filtered = [...currentOptionsData];

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
    showDismissibleToast(
      `✅ Generated ${filtered.length} recommendations using ${ALGORITHMS.find(a => a.id === selectedAlgorithm)?.name} algorithm`
    );
  };

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    const currentOptionsData = optionType === 'calls' ? callsData : putsData;
    const sourceData = activeTab === 'all' ? currentOptionsData : recommendations;
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
  }, [callsData, putsData, optionType, recommendations, filters, sortConfig, activeTab]);

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

    toast.success('✅ CSV exported successfully', {
      duration: 3000, // CSV export can auto-dismiss after 3 seconds
      position: 'top-right',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Stock Price Display */}
      {stockPrice && (
        <StockPriceHeader
          symbol={ticker}
          currentPrice={stockPrice}
          priceChange={priceChange}
          priceChangePercent={priceChangePercent}
        />
      )}

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
                  onChange={handleTickerChange}
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

              {(callsData.length > 0 || putsData.length > 0) && (
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
            {(chainError as Error).message.includes('Access denied') && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">API Subscription Issue</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Your current API subscription doesn't include options data access. Consider
                  upgrading your Polygon.io plan or try with a different stock symbol.
                </p>
              </div>
            )}
            {(chainError as Error).message.includes('options data not available') && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm font-medium">No Options Available</p>
                <p className="text-blue-700 text-sm mt-1">
                  This stock may not have listed options or the market may be closed. Try popular
                  symbols like AAPL, MSFT, TSLA, or SPY.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {(callsData.length > 0 || putsData.length > 0 || recommendations.length > 0) && (
        <>
          {/* Option Type Tabs (Calls/Puts) */}
          <Tabs
            value={optionType}
            onValueChange={value => setOptionType(value as 'calls' | 'puts')}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="calls" className="flex items-center gap-2">
                  Calls ({callsData.length})
                </TabsTrigger>
                <TabsTrigger value="puts" className="flex items-center gap-2">
                  Puts ({putsData.length})
                </TabsTrigger>
              </TabsList>

              {/* Export CSV button inline with CALLS/PUTS */}
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

            {/* Recommendations action buttons */}
            {activeTab === 'recommendations' && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <select
                  value={selectedAlgorithm}
                  onChange={handleAlgorithmChange}
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
              </div>
            )}

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

            {/* Content area - shows different data based on activeTab */}
            <div className="space-y-4">
              {/* Filter Panel */}
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                validationErrors={validationErrors}
                onValidationErrors={setValidationErrors}
                currentPrice={stockPrice}
                locRate={locRate}
                onLocRateChange={setLocRate}
                totalResults={
                  activeTab === 'all'
                    ? optionType === 'calls'
                      ? callsData.length
                      : putsData.length
                    : filteredData.length
                }
                activeTab={activeTab}
                onTabChange={setActiveTab}
                recommendationsCount={recommendations.length}
              />

              {/* Options Table */}
              <OptionsTable
                data={paginatedData}
                currency="USD"
                loading={isLoadingChain}
                onSort={setSortConfig}
                showGreeks={true}
                showAdvancedMetrics={true}
                optionType={optionType}
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
              {/* Empty recommendations state */}
              {activeTab === 'recommendations' && recommendations.length === 0 && (
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
            </div>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!isLoadingChain && callsData.length === 0 && putsData.length === 0 && (
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
