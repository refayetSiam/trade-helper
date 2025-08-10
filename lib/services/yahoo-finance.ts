import yahooFinance from 'yahoo-finance2';
import { ChartDataPoint, TimeRange } from './chart-data';

export interface StockQuote {
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
}

export interface OptionContract {
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
}

export interface OptionsExpiry {
  expirationDate: number;
  hasMiniOptions: boolean;
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface OptionsChainData {
  quote: StockQuote;
  options: OptionsExpiry[];
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

class YahooFinanceService {
  /**
   * Get current stock quote - simplified version that should work
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      // Use the simplest possible quote call
      const quote = await yahooFinance.quote(symbol);

      // More robust parsing with fallbacks
      if (!quote) {
        throw new Error(`No quote data returned for ${symbol}`);
      }

      const quoteData = quote as any;

      // Ensure we have essential data
      if (!quoteData.regularMarketPrice && !quoteData.price && !quoteData.ask && !quoteData.bid) {
        throw new Error(`No price data available for ${symbol}`);
      }

      return {
        symbol: quoteData.symbol || symbol,
        regularMarketPrice:
          quoteData.regularMarketPrice || quoteData.price || quoteData.ask || quoteData.bid || 0,
        currency: quoteData.currency || 'USD',
        marketCap: quoteData.marketCap,
        trailingPE: quoteData.trailingPE,
        dividendYield: quoteData.dividendYield,
        fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
        averageVolume: quoteData.averageVolume,
        marketState: quoteData.marketState || 'REGULAR',
      };
    } catch (error) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  /**
   * Get options chain - fetch all available expiration dates
   */
  async getOptionsChain(symbol: string, maxExpirations?: number): Promise<OptionsChainData> {
    try {
      // First get the quote
      const quote = await this.getQuote(symbol);

      // Get the initial options data to retrieve all available expiration dates
      let initialData;
      try {
        initialData = await yahooFinance.options(symbol, {});
      } catch (error) {
        throw new Error(
          `No options data available for ${symbol}. This symbol may not have options trading or may be delisted.`
        );
      }

      if (
        !initialData ||
        !initialData.expirationDates ||
        initialData.expirationDates.length === 0
      ) {
        throw new Error('No expiration dates found for options');
      }

      // Fetch options for all expiration dates
      const allOptions: OptionsExpiry[] = [];

      // Limit expiration dates to avoid too many API calls (default 10, max 20)
      const limit = Math.min(maxExpirations || 10, 20);
      const datesToFetch = initialData.expirationDates.slice(0, limit);

      for (const expirationDate of datesToFetch) {
        try {
          const optionsData = await yahooFinance.options(symbol, { date: expirationDate });

          if (optionsData && optionsData.options && optionsData.options.length > 0) {
            const expiry = optionsData.options[0];

            // Handle expiration date - could be Date object or timestamp
            let expirationTimestamp: number;
            if (expiry.expirationDate instanceof Date) {
              expirationTimestamp = Math.floor(expiry.expirationDate.getTime() / 1000);
            } else if (typeof expiry.expirationDate === 'number') {
              expirationTimestamp = expiry.expirationDate;
            } else {
              // Try to parse as string
              expirationTimestamp = Math.floor(new Date(expiry.expirationDate).getTime() / 1000);
            }

            allOptions.push({
              expirationDate: expirationTimestamp,
              hasMiniOptions: expiry.hasMiniOptions || false,
              calls: (expiry.calls || []).map((call: any) => ({
                contractSymbol:
                  call.contractSymbol ||
                  `${symbol}${new Date(expirationTimestamp * 1000).toISOString().slice(0, 10)}C${call.strike}`,
                strike: call.strike || 0,
                currency: call.currency || 'USD',
                lastPrice: call.lastPrice || 0,
                change: call.change || 0,
                percentChange: call.percentChange || 0,
                volume: call.volume || 0,
                openInterest: call.openInterest || 0,
                bid: call.bid || 0,
                ask: call.ask || 0,
                contractSize: call.contractSize || 'REGULAR',
                expiration: expirationTimestamp,
                impliedVolatility: call.impliedVolatility || 0.2, // Default to 20% if not available
                inTheMoney: call.strike < quote.regularMarketPrice,
              })),
              puts: (expiry.puts || []).map((put: any) => ({
                contractSymbol:
                  put.contractSymbol ||
                  `${symbol}${new Date(expirationTimestamp * 1000).toISOString().slice(0, 10)}P${put.strike}`,
                strike: put.strike || 0,
                currency: put.currency || 'USD',
                lastPrice: put.lastPrice || 0,
                change: put.change || 0,
                percentChange: put.percentChange || 0,
                volume: put.volume || 0,
                openInterest: put.openInterest || 0,
                bid: put.bid || 0,
                ask: put.ask || 0,
                contractSize: put.contractSize || 'REGULAR',
                expiration: expirationTimestamp,
                impliedVolatility: put.impliedVolatility || 0.2, // Default to 20% if not available
                inTheMoney: put.strike > quote.regularMarketPrice,
              })),
            });
          }
        } catch (error) {
          // Continue with other dates even if one fails
        }
      }

      return {
        quote,
        options: allOptions,
      };
    } catch (error) {
      // If it's a specific error about options not available, provide a helpful message
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes('options') || errorMsg?.includes('Option')) {
        throw new Error(
          `Options data not available for ${symbol}. This stock may not have listed options or market may be closed.`
        );
      }

      throw new Error(`Failed to fetch options chain for ${symbol}: ${errorMsg}`);
    }
  }

  /**
   * Search for stocks - simplified version
   */
  async searchStocks(query: string): Promise<SearchResult[]> {
    try {
      const results = await yahooFinance.search(query);

      return ((results as any).quotes || [])
        .filter((quote: any) => quote.symbol && (quote.longname || quote.shortname))
        .slice(0, 10)
        .map((quote: any) => ({
          symbol: quote.symbol || '',
          name: quote.longname || quote.shortname || quote.symbol || '',
          type: quote.quoteType || 'EQUITY',
          exchange: quote.exchange || '',
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get historical data in ChartDataPoint format
   */
  async getHistoricalData(
    symbol: string,
    range: TimeRange,
    customInterval?: string | null
  ): Promise<ChartDataPoint[]> {
    const { period1, period2, interval: defaultInterval } = this.getYahooPeriod(range);
    const interval = customInterval || defaultInterval;

    // Check if this is an intraday interval that requires chart API
    const isIntradayInterval = this.isIntradayInterval(interval);

    try {
      let history;

      if (isIntradayInterval) {
        try {
          history = await yahooFinance.chart(symbol, {
            period1,
            period2,
            interval: interval as any,
          });
          // Transform chart response to match historical format
          history = history.quotes || [];
        } catch (intradayError) {
          // Fallback to daily data if intraday fails
          history = await yahooFinance.historical(symbol, {
            period1,
            period2,
            interval: '1d' as any,
          });
        }
      } else {
        history = await yahooFinance.historical(symbol, {
          period1,
          period2,
          interval: interval as any,
        });
      }

      const chartData: ChartDataPoint[] = history.map((item: any) => ({
        date: new Date(item.date),
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0,
        adjClose: item.adjClose || item.close || 0,
      }));

      return chartData;
    } catch (error) {
      // Try one more fallback with the most basic daily data request
      try {
        const fallbackHistory = await yahooFinance.historical(symbol, {
          period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          period2: new Date(),
          interval: '1d' as any,
        });

        const fallbackData: ChartDataPoint[] = fallbackHistory.map((item: any) => ({
          date: new Date(item.date),
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0,
          adjClose: item.adjClose || item.close || 0,
        }));

        return fallbackData;
      } catch (fallbackError) {
        throw new Error(
          `Failed to fetch historical data for ${symbol}. Both intraday and daily data requests failed.`
        );
      }
    }
  }

  // Check if interval requires intraday chart API
  private isIntradayInterval(interval: string): boolean {
    const intradayIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h'];
    return intradayIntervals.includes(interval);
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
        interval = '1h'; // Use hourly data for 5-day range
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

  // Clear cache (for compatibility)
  clearCache() {}

  /**
   * Test connection with a simple quote call
   */
  async testConnection(symbol: string = 'AAPL'): Promise<boolean> {
    try {
      const quote = await yahooFinance.quote(symbol);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const yahooFinanceService = new YahooFinanceService();
