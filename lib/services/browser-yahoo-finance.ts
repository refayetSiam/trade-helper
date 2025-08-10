import { ChartDataPoint, TimeRange } from './chart-data';

export interface BrowserStockQuote {
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

/**
 * Browser-compatible Yahoo Finance service that uses API routes
 * This avoids the URLSearchParams constructor error by moving Yahoo Finance calls to server-side
 */
class BrowserYahooFinanceService {
  /**
   * Get current stock quote via API route
   */
  async getQuote(symbol: string): Promise<BrowserStockQuote> {
    try {
      const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${error}`);
    }
  }

  /**
   * Get historical data via API route
   */
  async getHistoricalData(
    symbol: string,
    range: TimeRange,
    customInterval?: string | null
  ): Promise<ChartDataPoint[]> {
    try {
      const params = new URLSearchParams({
        symbol: symbol.toUpperCase(),
        range,
      });

      if (customInterval) {
        params.append('interval', customInterval);
      }

      const response = await fetch(`/api/yahoo-historical?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data.chartData;
    } catch (error) {
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error}`);
    }
  }

  /**
   * Test connection via API route
   */
  async testConnection(symbol: string = 'AAPL'): Promise<boolean> {
    try {
      await this.getQuote(symbol);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear cache (no-op for browser service, server handles caching)
   */
  clearCache() {}
}

export const browserYahooFinanceService = new BrowserYahooFinanceService();
