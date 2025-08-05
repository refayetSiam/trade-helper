import { restClient } from '@polygon.io/client-js';
import { polygonRateLimiter } from './polygon-rate-limiter';
import { ChartDataPoint, TimeRange, DataFreshnessInfo } from './chart-data';

// Initialize Polygon client
const polygonClient = restClient(process.env.POLYGON_API_KEY!, 'https://api.polygon.io') as any;

export interface PolygonAggregate {
  v: number; // volume
  vw: number; // volume weighted average
  o: number; // open
  c: number; // close
  h: number; // high
  l: number; // low
  t: number; // timestamp
  n: number; // number of transactions
}

export interface PolygonOptionsContract {
  ticker?: string;
  underlying_ticker?: string;
  contract_type?: string;
  expiration_date?: string;
  strike_price?: number;
  shares_per_contract?: number;
  cfi?: string;
  correction?: number;
  exercise_style?: string;
  primary_exchange?: string;
}

export interface PolygonOptionsQuote {
  underlying_ticker: string;
  contract_ticker: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility?: number;
}

// Interface to match our existing OptionsChainData format

export interface TransformedOptionsData {
  quote: {
    symbol: string;
    regularMarketPrice: number;
    currency: string;
    marketCap?: number;
    trailingPE?: number;
    dividendYield?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    averageVolume?: number;
    marketState: string;
  };
  options: Array<{
    expirationDate: number;
    hasMiniOptions: boolean;
    calls: Array<{
      contractSymbol: string;
      strike: number;
      currency: string;
      lastPrice: number;
      change: number;
      percentChange: number;
      volume?: number;
      openInterest?: number;
      bid?: number;
      ask?: number;
      contractSize: string;
      expiration: number;
      impliedVolatility?: number;
      inTheMoney: boolean;
    }>;
    puts: Array<{
      contractSymbol: string;
      strike: number;
      currency: string;
      lastPrice: number;
      change: number;
      percentChange: number;
      volume?: number;
      openInterest?: number;
      bid?: number;
      ask?: number;
      contractSize: string;
      expiration: number;
      impliedVolatility?: number;
      inTheMoney: boolean;
    }>;
  }>;
}

class PolygonService {
  private cache = new Map<string, { data: any; timestamp: number; expiry: number }>();

  // Get cached data if valid
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.expiry) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any, expiryMs: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    });
  }

  // Convert time range to appropriate multiplier and timespan for Polygon
  private getPolygonParams(range: TimeRange): {
    multiplier: number;
    timespan: string;
    from: string;
    to: string;
  } {
    const now = new Date();
    const toDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`📅 Using current system date: ${now.toISOString()}`);

    let fromDate: Date;
    let multiplier: number;
    let timespan: string;

    switch (range) {
      case '1D':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        multiplier = 5;
        timespan = 'minute';
        break;
      case '5D':
        fromDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        multiplier = 15;
        timespan = 'minute';
        break;
      case '1M':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'hour';
        break;
      case '3M':
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'day';
        break;
      case '6M':
        fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'day';
        break;
      case 'YTD':
        fromDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
        multiplier = 1;
        timespan = 'day';
        break;
      case '1Y':
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'day';
        break;
      case '2Y':
        fromDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'week';
        break;
      case '5Y':
        fromDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 1000);
        multiplier = 1;
        timespan = 'week';
        break;
      case 'MAX':
        fromDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); // 10 years max
        multiplier = 1;
        timespan = 'month';
        break;
      default:
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        multiplier = 1;
        timespan = 'day';
    }

    const fromDateStr = fromDate.toISOString().split('T')[0];

    return {
      multiplier,
      timespan,
      from: fromDateStr,
      to: toDate,
    };
  }

  // Check data freshness
  private checkDataFreshness(data: ChartDataPoint[], range: TimeRange): DataFreshnessInfo {
    if (data.length === 0) {
      return {
        isStale: true,
        daysBehind: 0,
        lastDataDate: new Date().toISOString(),
        expectedDataDate: new Date().toISOString(),
        warningMessage: 'No data available',
      };
    }

    const now = new Date();
    const lastDataPoint = data[data.length - 1];
    const lastDataDate = new Date(lastDataPoint.date);

    // Calculate expected freshness based on range
    let expectedMaxAge = 3; // Default 3 days for daily data
    let expectedDataDate = new Date(now);

    switch (range) {
      case '1D':
        expectedMaxAge = 1; // Intraday should be same day or 1 day old
        expectedDataDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '5D':
        expectedMaxAge = 3; // 5-day range should have data within 3 days
        expectedDataDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
      case '3M':
      case '6M':
        expectedMaxAge = 5; // Monthly ranges can be up to 5 days behind
        expectedDataDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      default:
        expectedMaxAge = 7; // Longer ranges can be up to a week behind
        expectedDataDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const daysBehind = Math.floor((now.getTime() - lastDataDate.getTime()) / (24 * 60 * 60 * 1000));
    const isStale = daysBehind > expectedMaxAge;

    let warningMessage;
    if (isStale) {
      if (daysBehind <= 7) {
        warningMessage = `Data is ${daysBehind} day${daysBehind === 1 ? '' : 's'} behind current date`;
      } else if (daysBehind <= 30) {
        const weeks = Math.floor(daysBehind / 7);
        warningMessage = `Data is ${weeks} week${weeks === 1 ? '' : 's'} behind current date`;
      } else {
        const months = Math.floor(daysBehind / 30);
        warningMessage = `Data is ${months} month${months === 1 ? '' : 's'} behind current date`;
      }
    }

    return {
      isStale,
      daysBehind,
      lastDataDate: lastDataDate.toISOString(),
      expectedDataDate: expectedDataDate.toISOString(),
      warningMessage,
    };
  }

  // Fetch stock aggregates (chart data) with freshness info
  async getStockAggregates(
    symbol: string,
    range: TimeRange,
    priority: 'high' | 'low' = 'high'
  ): Promise<{ data: ChartDataPoint[]; freshness: DataFreshnessInfo }> {
    const cacheKey = `aggregates_${symbol}_${range}`;

    // Check cache first
    const cached = this.getCachedData<{ data: ChartDataPoint[]; freshness: DataFreshnessInfo }>(
      cacheKey
    );
    if (cached) {
      console.log(`📋 Cache hit for ${symbol} ${range}`);
      return cached;
    }

    // Get Polygon parameters
    const { multiplier, timespan, from, to } = this.getPolygonParams(range);

    console.log(
      `📡 Fetching ${symbol} aggregates: ${multiplier} ${timespan} from ${from} to ${to}`
    );

    // Make rate-limited request
    const data = await polygonRateLimiter.makeRequest(async () => {
      try {
        const response = await polygonClient.getStocksAggregates(
          symbol,
          multiplier,
          timespan as any,
          from,
          to
        );
        return response;
      } catch (error) {
        console.error('Polygon API error:', error);
        throw error;
      }
    }, priority);

    // Transform Polygon data to our format
    const chartData = this.transformAggregateData(data.results || []);

    // Check data freshness
    const freshness = this.checkDataFreshness(chartData, range);

    // Log freshness information
    if (freshness.isStale) {
      console.warn(`⚠️  Stale data detected for ${symbol}: ${freshness.warningMessage}`);
    } else {
      console.log(
        `✅ Fresh data for ${symbol}: last updated ${freshness.daysBehind} day${freshness.daysBehind === 1 ? '' : 's'} ago`
      );
    }

    const result = { data: chartData, freshness };

    // Cache the result
    const cacheExpiry = this.getCacheExpiry(range);
    this.setCachedData(cacheKey, result, cacheExpiry);

    console.log(`✅ Fetched ${chartData.length} data points for ${symbol} ${range}`);
    return result;
  }

  // Transform Polygon aggregate data to our chart format
  private transformAggregateData(aggregates: PolygonAggregate[]): ChartDataPoint[] {
    return aggregates.map(agg => ({
      date: new Date(agg.t),
      open: parseFloat((agg.o || 0).toFixed(2)),
      high: parseFloat((agg.h || 0).toFixed(2)),
      low: parseFloat((agg.l || 0).toFixed(2)),
      close: parseFloat((agg.c || 0).toFixed(2)),
      volume: agg.v || 0,
      adjClose: parseFloat((agg.c || 0).toFixed(2)), // Polygon provides split-adjusted data
    }));
  }

  // Get cache expiry time based on range
  private getCacheExpiry(range: TimeRange): number {
    switch (range) {
      case '1D':
        return 5 * 60 * 1000; // 5 minutes for intraday
      case '5D':
        return 10 * 60 * 1000; // 10 minutes
      case '1M':
      case '3M':
        return 15 * 60 * 1000; // 15 minutes
      default:
        return 30 * 60 * 1000; // 30 minutes for longer ranges
    }
  }

  // Fetch options contracts for a symbol
  async getOptionsContracts(
    symbol: string,
    forceRefresh: boolean = false,
    priority: 'high' | 'low' = 'high'
  ): Promise<PolygonOptionsContract[]> {
    const cacheKey = `options_contracts_${symbol}`;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedData<PolygonOptionsContract[]>(cacheKey);
      if (cached) {
        console.log(`📋 Cache hit for ${symbol} options contracts`);
        return cached;
      }
    }

    console.log(
      `📡 Fetching options contracts for ${symbol}${forceRefresh ? ' (force refresh)' : ''}`
    );

    // Make rate-limited request
    const data = await polygonRateLimiter.makeRequest(async () => {
      try {
        const response = await polygonClient.listOptionsContracts(symbol);

        return response;
      } catch (error) {
        console.error('Polygon options API error:', error);
        throw error;
      }
    }, priority);

    const contracts = data.results || [];

    // Cache until manual refresh (1 hour as safety)
    this.setCachedData(cacheKey, contracts, 60 * 60 * 1000);

    console.log(`✅ Fetched ${contracts.length} options contracts for ${symbol}`);
    return contracts;
  }

  // Get last quote for a stock
  async getLastQuote(
    symbol: string,
    priority: 'high' | 'low' = 'low'
  ): Promise<{ price: number; timestamp: number }> {
    const cacheKey = `last_quote_${symbol}`;

    // Check cache first (1 minute cache for quotes)
    const cached = this.getCachedData<{ price: number; timestamp: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make rate-limited request
    const data = await polygonRateLimiter.makeRequest(async () => {
      try {
        const response = await polygonClient.getLastStocksQuote(symbol);
        return response;
      } catch (error) {
        console.error('Polygon quote API error:', error);
        throw error;
      }
    }, priority);

    const quote = {
      price: data.results?.P || 0, // Last price
      timestamp: data.results?.t || Date.now(),
    };

    // Cache for 1 minute
    this.setCachedData(cacheKey, quote, 60 * 1000);

    return quote;
  }

  // Get market status
  async getMarketStatus(): Promise<{ market: string; serverTime: string }> {
    const cacheKey = 'market_status';

    // Check cache first (5 minute cache)
    const cached = this.getCachedData<{ market: string; serverTime: string }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make rate-limited request
    const data = await polygonRateLimiter.makeRequest(async () => {
      try {
        const response = await polygonClient.getMarketStatus();
        return response;
      } catch (error) {
        console.error('Polygon market status API error:', error);
        throw error;
      }
    }, 'low');

    const status = {
      market: data.market || 'unknown',
      serverTime: data.serverTime || new Date().toISOString(),
    };

    // Cache for 5 minutes
    this.setCachedData(cacheKey, status, 5 * 60 * 1000);

    return status;
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Polygon cache cleared');
  }

  // Get complete options chain for covered calls
  async getOptionsChain(
    symbol: string,
    forceRefresh: boolean = false,
    priority: 'high' | 'low' = 'high'
  ): Promise<TransformedOptionsData> {
    console.log(
      `📊 Fetching complete options chain for ${symbol}${forceRefresh ? ' (force refresh)' : ''}`
    );

    // Get both the stock quote and options contracts
    const [quote, contracts] = await Promise.all([
      this.getLastQuote(symbol, priority),
      this.getOptionsContracts(symbol, forceRefresh, priority),
    ]);

    // Group contracts by expiration date and type
    const expirationGroups: Record<
      string,
      { calls: PolygonOptionsContract[]; puts: PolygonOptionsContract[] }
    > = {};

    contracts.forEach(contract => {
      const expDate = contract.expiration_date;
      if (!expDate) return; // Skip contracts without expiration date

      if (!expirationGroups[expDate]) {
        expirationGroups[expDate] = { calls: [], puts: [] };
      }

      if (contract.contract_type === 'call') {
        expirationGroups[expDate].calls.push(contract);
      } else if (contract.contract_type === 'put') {
        expirationGroups[expDate].puts.push(contract);
      }
    });

    // Transform to our expected format
    const options = Object.entries(expirationGroups)
      .map(([expDate, { calls, puts }]) => {
        const expirationTimestamp = new Date(expDate).getTime() / 1000;

        return {
          expirationDate: expirationTimestamp,
          hasMiniOptions: false,
          calls: calls.map(call => ({
            contractSymbol: call.ticker || '',
            strike: call.strike_price || 0,
            currency: 'USD',
            lastPrice: 0.5, // Default - would need separate API call for real prices
            change: 0,
            percentChange: 0,
            volume: 0,
            openInterest: 0,
            bid: 0.45,
            ask: 0.55,
            contractSize: 'REGULAR',
            expiration: expirationTimestamp,
            impliedVolatility: 0.2,
            inTheMoney: quote.price > (call.strike_price || 0),
          })),
          puts: puts.map(put => ({
            contractSymbol: put.ticker || '',
            strike: put.strike_price || 0,
            currency: 'USD',
            lastPrice: 0.5,
            change: 0,
            percentChange: 0,
            volume: 0,
            openInterest: 0,
            bid: 0.45,
            ask: 0.55,
            contractSize: 'REGULAR',
            expiration: expirationTimestamp,
            impliedVolatility: 0.2,
            inTheMoney: quote.price < (put.strike_price || 0),
          })),
        };
      })
      .sort((a, b) => a.expirationDate - b.expirationDate);

    const result: TransformedOptionsData = {
      quote: {
        symbol: symbol.toUpperCase(),
        regularMarketPrice: quote.price,
        currency: 'USD',
        marketState: 'REGULAR',
      },
      options,
    };

    console.log(`✅ Processed options chain for ${symbol}: ${options.length} expiration dates`);
    return result;
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    const stats = {
      total: entries.length,
      expired: entries.filter(([_, { timestamp, expiry }]) => now >= timestamp + expiry).length,
      byType: {} as Record<string, number>,
    };

    entries.forEach(([key]) => {
      const type = key.split('_')[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }
}

export const polygonService = new PolygonService();
