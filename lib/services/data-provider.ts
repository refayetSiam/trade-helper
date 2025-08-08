import { yahooFinanceService } from './yahoo-finance';
import { polygonService } from './polygon';
import { ChartDataPoint, TimeRange, DataFreshnessInfo } from './chart-data';

export type DataSource = 'source1' | 'source2';

export interface DataProviderConfig {
  primarySource: DataSource;
  fallbackEnabled: boolean;
}

export interface ChartDataWithSource {
  data: ChartDataPoint[];
  freshness: DataFreshnessInfo;
  source: DataSource;
  sourceLabel: string;
}

export interface QuoteWithSource {
  price: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
  volume?: number;
  source: DataSource;
  sourceLabel: string;
}

class DataProviderService {
  private config: DataProviderConfig = {
    primarySource: 'source1', // Yahoo Finance by default
    fallbackEnabled: true,
  };

  private requestCounts = new Map<DataSource, { count: number; resetTime: number }>();
  private maxCallsPerMinute = 100; // Generous limit for combined services

  // Get current configuration
  getConfig(): DataProviderConfig {
    return { ...this.config };
  }

  // Set data source preference
  setDataSource(source: DataSource) {
    this.config.primarySource = source;
    console.log(`🔄 Data source switched to ${this.getSourceLabel(source)}`);
  }

  // Toggle fallback behavior
  setFallbackEnabled(enabled: boolean) {
    this.config.fallbackEnabled = enabled;
    console.log(`🔄 Fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get human-readable source label
  private getSourceLabel(source: DataSource): string {
    return source === 'source1' ? 'Source 1' : 'Source 2';
  }

  // Track API usage
  private trackRequest(source: DataSource) {
    const now = Date.now();
    const current = this.requestCounts.get(source) || { count: 0, resetTime: now + 60000 };

    // Reset counter if minute has passed
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + 60000;
    }

    current.count++;
    this.requestCounts.set(source, current);
  }

  // Get remaining API calls
  getRemainingCalls(source: DataSource): number {
    const current = this.requestCounts.get(source);
    if (!current || Date.now() > current.resetTime) {
      return this.maxCallsPerMinute;
    }
    return Math.max(0, this.maxCallsPerMinute - current.count);
  }

  // Get combined API status
  getApiStatus() {
    const source1Remaining = this.getRemainingCalls('source1');
    const source2Remaining = this.getRemainingCalls('source2');
    const totalRemaining = source1Remaining + source2Remaining;
    const maxTotal = this.maxCallsPerMinute * 2;

    return {
      source1: {
        remaining: source1Remaining,
        max: this.maxCallsPerMinute,
      },
      source2: {
        remaining: source2Remaining,
        max: this.maxCallsPerMinute,
      },
      combined: {
        remaining: totalRemaining,
        max: maxTotal,
        percentage: Math.round((totalRemaining / maxTotal) * 100),
      },
    };
  }

  // Fetch chart data with intelligent source selection
  async getChartData(symbol: string, range: TimeRange): Promise<ChartDataWithSource> {
    const primarySource = this.config.primarySource;
    const fallbackSource: DataSource = primarySource === 'source1' ? 'source2' : 'source1';

    // Try primary source first
    try {
      console.log(
        `📡 Fetching chart data for ${symbol} from ${this.getSourceLabel(primarySource)}`
      );
      this.trackRequest(primarySource);

      let result;
      if (primarySource === 'source1') {
        // Yahoo Finance
        const data = await yahooFinanceService.getHistoricalData(symbol, range);
        const freshness = this.createFreshnessInfo(data, range);
        result = { data, freshness };
      } else {
        // Polygon
        result = await polygonService.getStockAggregates(symbol, range, 'high');
      }

      return {
        ...result,
        source: primarySource,
        sourceLabel: this.getSourceLabel(primarySource),
      };
    } catch (primaryError) {
      console.warn(`❌ ${this.getSourceLabel(primarySource)} failed:`, primaryError);

      if (!this.config.fallbackEnabled) {
        throw primaryError;
      }

      // Try fallback source
      try {
        console.log(`🔄 Falling back to ${this.getSourceLabel(fallbackSource)}`);
        this.trackRequest(fallbackSource);

        let result;
        if (fallbackSource === 'source1') {
          // Yahoo Finance
          const data = await yahooFinanceService.getHistoricalData(symbol, range);
          const freshness = this.createFreshnessInfo(data, range);
          result = { data, freshness };
        } else {
          // Polygon
          result = await polygonService.getStockAggregates(symbol, range, 'high');
        }

        return {
          ...result,
          source: fallbackSource,
          sourceLabel: `${this.getSourceLabel(fallbackSource)} (fallback)`,
        };
      } catch (fallbackError) {
        console.error(
          `❌ Both data sources failed. Primary:`,
          primaryError,
          'Fallback:',
          fallbackError
        );
        throw new Error(
          `All data sources failed. Primary: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
        );
      }
    }
  }

  // Fetch stock quote with intelligent source selection
  async getQuote(symbol: string): Promise<QuoteWithSource> {
    const primarySource = this.config.primarySource;
    const fallbackSource: DataSource = primarySource === 'source1' ? 'source2' : 'source1';

    // Try primary source first
    try {
      console.log(`📡 Fetching quote for ${symbol} from ${this.getSourceLabel(primarySource)}`);
      this.trackRequest(primarySource);

      let quote;
      if (primarySource === 'source1') {
        // Yahoo Finance
        const result = await yahooFinanceService.getQuote(symbol);
        quote = {
          price: result.regularMarketPrice,
          timestamp: Date.now(),
          volume: result.averageVolume,
        };
      } else {
        // Polygon
        const result = await polygonService.getLastQuote(symbol, 'high');
        quote = {
          price: result.price,
          timestamp: result.timestamp,
        };
      }

      return {
        ...quote,
        source: primarySource,
        sourceLabel: this.getSourceLabel(primarySource),
      };
    } catch (primaryError) {
      console.warn(`❌ ${this.getSourceLabel(primarySource)} quote failed:`, primaryError);

      if (!this.config.fallbackEnabled) {
        throw primaryError;
      }

      // Try fallback source
      try {
        console.log(`🔄 Quote fallback to ${this.getSourceLabel(fallbackSource)}`);
        this.trackRequest(fallbackSource);

        let quote;
        if (fallbackSource === 'source1') {
          // Yahoo Finance
          const result = await yahooFinanceService.getQuote(symbol);
          quote = {
            price: result.regularMarketPrice,
            timestamp: Date.now(),
            volume: result.averageVolume,
          };
        } else {
          // Polygon
          const result = await polygonService.getLastQuote(symbol, 'high');
          quote = {
            price: result.price,
            timestamp: result.timestamp,
          };
        }

        return {
          ...quote,
          source: fallbackSource,
          sourceLabel: `${this.getSourceLabel(fallbackSource)} (fallback)`,
        };
      } catch (fallbackError) {
        console.error(
          `❌ Both quote sources failed. Primary:`,
          primaryError,
          'Fallback:',
          fallbackError
        );
        throw new Error(
          `All quote sources failed. Primary: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
        );
      }
    }
  }

  // Fetch options chain with intelligent source selection
  async getOptionsChain(symbol: string, forceRefresh = false, maxExpirations?: number) {
    const primarySource = this.config.primarySource;
    const fallbackSource: DataSource = primarySource === 'source1' ? 'source2' : 'source1';

    // Try primary source first
    try {
      console.log(
        `📡 Fetching options chain for ${symbol} from ${this.getSourceLabel(primarySource)}`
      );
      this.trackRequest(primarySource);

      let result;
      if (primarySource === 'source1') {
        // Yahoo Finance
        result = await yahooFinanceService.getOptionsChain(symbol, maxExpirations);
      } else {
        // Polygon
        result = await polygonService.getOptionsChain(symbol, forceRefresh, 'high');
      }

      return {
        ...result,
        source: primarySource,
        sourceLabel: this.getSourceLabel(primarySource),
      };
    } catch (primaryError) {
      console.warn(`❌ ${this.getSourceLabel(primarySource)} options failed:`, primaryError);

      if (!this.config.fallbackEnabled) {
        throw primaryError;
      }

      // Try fallback source
      try {
        console.log(`🔄 Options fallback to ${this.getSourceLabel(fallbackSource)}`);
        this.trackRequest(fallbackSource);

        let result;
        if (fallbackSource === 'source1') {
          // Yahoo Finance
          result = await yahooFinanceService.getOptionsChain(symbol, maxExpirations);
        } else {
          // Polygon
          result = await polygonService.getOptionsChain(symbol, forceRefresh, 'high');
        }

        return {
          ...result,
          source: fallbackSource,
          sourceLabel: `${this.getSourceLabel(fallbackSource)} (fallback)`,
        };
      } catch (fallbackError) {
        console.error(
          `❌ Both options sources failed. Primary:`,
          primaryError,
          'Fallback:',
          fallbackError
        );
        throw new Error(
          `All options sources failed. Primary: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
        );
      }
    }
  }

  // Create freshness info for Yahoo Finance data (simpler than Polygon's complex logic)
  private createFreshnessInfo(data: ChartDataPoint[], range: TimeRange): DataFreshnessInfo {
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

    // Yahoo Finance is typically more current than Polygon
    let expectedMaxAge = 1; // Generally expect within 1 day

    switch (range) {
      case '1D':
        expectedMaxAge = 0.5; // Intraday should be within 12 hours
        break;
      case '5D':
        expectedMaxAge = 1; // Should be within 1 day
        break;
      default:
        expectedMaxAge = 2; // Longer ranges can be up to 2 days behind
    }

    const daysBehind = Math.floor((now.getTime() - lastDataDate.getTime()) / (24 * 60 * 60 * 1000));
    const isStale = daysBehind > expectedMaxAge;

    let warningMessage;
    if (isStale) {
      warningMessage = `Data is ${daysBehind} day${daysBehind === 1 ? '' : 's'} behind current date`;
    }

    return {
      isStale,
      daysBehind,
      lastDataDate: lastDataDate.toISOString(),
      expectedDataDate: new Date(
        now.getTime() - expectedMaxAge * 24 * 60 * 60 * 1000
      ).toISOString(),
      warningMessage,
    };
  }

  // Convert TimeRange to Yahoo Finance period
  private getYahooPeriod(range: TimeRange): { period1: Date; period2: Date; interval: string } {
    const now = new Date();
    let period1: Date;
    let interval: string;

    switch (range) {
      case '1D':
        period1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = '5m';
        break;
      case '5D':
        period1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        interval = '1d';
        break;
      case '1M':
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = '1d';
        break;
      case '3M':
        period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        interval = '1d';
        break;
      case '6M':
        period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        interval = '1d';
        break;
      case 'YTD':
        period1 = new Date(now.getFullYear(), 0, 1);
        interval = '1d';
        break;
      case '1Y':
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = '1d';
        break;
      case '2Y':
        period1 = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        interval = '1wk';
        break;
      case '5Y':
        period1 = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        interval = '1wk';
        break;
      case 'MAX':
        period1 = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
        interval = '1mo';
        break;
      default:
        period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        interval = '1d';
    }

    return { period1, period2: now, interval };
  }

  // Clear all caches
  clearAllCaches() {
    yahooFinanceService.clearCache?.();
    polygonService.clearCache();
    console.log('🧹 All data provider caches cleared');
  }
}

export const dataProvider = new DataProviderService();
