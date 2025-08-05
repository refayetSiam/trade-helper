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
      console.log(`Fetching quote for ${symbol}...`);

      // Use the simplest possible quote call
      const quote = await yahooFinance.quote(symbol);

      console.log('Quote data received:', JSON.stringify(quote, null, 2));

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
      console.error('Error fetching quote:', error);
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  /**
   * Get options chain - simplified to match Python yfinance approach
   */
  async getOptionsChain(symbol: string, expirationDates?: number[]): Promise<OptionsChainData> {
    try {
      console.log(`Fetching options chain for ${symbol}...`);

      // First get the quote
      const quote = await this.getQuote(symbol);
      console.log(`Current price for ${symbol}: $${quote.regularMarketPrice}`);

      // Try to get all available options chains - some tickers have multiple expiries
      let optionsData;
      try {
        // First try without any date restrictions to get all available expiries
        optionsData = await yahooFinance.options(symbol, {}, { validateResult: false } as any);
      } catch (error) {
        console.warn('Failed to get full options chain, trying alternative approach:', error);
        try {
          // Fallback to basic call
          optionsData = await yahooFinance.options(symbol, {});
        } catch (secondError) {
          console.error('Both options calls failed:', secondError);
          throw new Error(
            `No options data available for ${symbol}. This symbol may not have options trading or may be delisted.`
          );
        }
      }
      console.log('Options data structure:', optionsData);

      if (!optionsData || !optionsData.options) {
        throw new Error('No options data returned from Yahoo Finance');
      }

      // Transform the data to match our interface
      const transformedOptions: OptionsExpiry[] = optionsData.options.map((expiry: any) => {
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

        return {
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
        };
      });

      console.log(`Processed ${transformedOptions.length} expiration dates`);
      transformedOptions.forEach((expiry, i) => {
        console.log(`Expiry ${i + 1}: ${expiry.calls.length} calls, ${expiry.puts.length} puts`);
      });

      return {
        quote,
        options: transformedOptions,
      };
    } catch (error) {
      console.error('Detailed error fetching options chain:', error);

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
      console.log(`Searching for: ${query}`);
      const results = await yahooFinance.search(query);

      console.log('Search results:', results);

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
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Get historical data in ChartDataPoint format
   */
  async getHistoricalData(symbol: string, range: TimeRange): Promise<ChartDataPoint[]> {
    try {
      const { period1, period2, interval } = this.getYahooPeriod(range);

      console.log(`📡 Fetching ${symbol} from Yahoo Finance: ${range} (${interval})`);

      const history = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval: interval as any,
      });

      const chartData: ChartDataPoint[] = history.map(item => ({
        date: new Date(item.date),
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0,
        adjClose: item.adjClose || item.close || 0,
      }));

      console.log(
        `✅ Yahoo Finance: Fetched ${chartData.length} data points for ${symbol} ${range}`
      );
      return chartData;
    } catch (error) {
      console.error(`❌ Yahoo Finance historical data error for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error}`);
    }
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
        interval = '15m';
        break;
      case '1M':
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = '1h';
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
  clearCache() {
    console.log('🧹 Yahoo Finance cache cleared (no-op)');
  }

  /**
   * Test connection with a simple quote call
   */
  async testConnection(symbol: string = 'AAPL'): Promise<boolean> {
    try {
      console.log(`Testing Yahoo Finance connection with ${symbol}...`);
      const quote = await yahooFinance.quote(symbol);
      console.log(
        `✅ Connection test successful. ${symbol} price: $${(quote as any).regularMarketPrice}`
      );
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const yahooFinanceService = new YahooFinanceService();
