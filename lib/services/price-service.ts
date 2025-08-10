import { dataProvider } from './data-provider';
import { ChartDataPoint, TimeRange } from './chart-data';

export interface PriceData {
  currentPrice: number;
  priceChange: number | null;
  priceChangePercent: number | null;
  source: string;
  timestamp: number;
}

export interface PriceWithValidation extends PriceData {
  isValidated: boolean;
  validationWarning?: string;
}

class PriceService {
  /**
   * Get the most accurate current price for a stock symbol
   * Prioritizes last close price from recent chart data over quote API
   */
  async getPrimaryStockPrice(
    symbol: string,
    timeRange: TimeRange = '5D'
  ): Promise<PriceWithValidation> {
    try {
      // First try to get accurate price from recent chart data
      try {
        const chartResult = await dataProvider.getChartData(symbol, timeRange);
        if (chartResult.data && chartResult.data.length > 0) {
          const lastDataPoint = chartResult.data[chartResult.data.length - 1];
          const firstDataPoint = chartResult.data[0];

          const currentPrice = lastDataPoint.close;
          const priceChange = currentPrice - firstDataPoint.close;
          const priceChangePercent = (priceChange / firstDataPoint.close) * 100;

          return {
            currentPrice,
            priceChange,
            priceChangePercent,
            source: `Chart (${chartResult.sourceLabel})`,
            timestamp: lastDataPoint.date.getTime(),
            isValidated: true,
          };
        }
      } catch (chartError) {
        // Try with a longer timeframe if the original failed
        if (timeRange !== '1M') {
          try {
            const fallbackChartResult = await dataProvider.getChartData(symbol, '1M');
            if (fallbackChartResult.data && fallbackChartResult.data.length > 0) {
              const lastDataPoint = fallbackChartResult.data[fallbackChartResult.data.length - 1];
              const firstDataPoint = fallbackChartResult.data[0];

              const currentPrice = lastDataPoint.close;
              const priceChange = currentPrice - firstDataPoint.close;
              const priceChangePercent = (priceChange / firstDataPoint.close) * 100;

              return {
                currentPrice,
                priceChange,
                priceChangePercent,
                source: `Chart Fallback (${fallbackChartResult.sourceLabel})`,
                timestamp: lastDataPoint.date.getTime(),
                isValidated: true,
                validationWarning: `Used ${timeRange} fallback instead of requested timeframe`,
              };
            }
          } catch (fallbackChartError) {
            // Fallback chart data failed, continue to quote API
          }
        }
      }

      // Fallback to quote API if chart data is unavailable
      try {
        const quoteResult = await dataProvider.getQuote(symbol);

        // For quote API, we don't have reliable price change data without additional requests
        const currentPrice = quoteResult.price;

        return {
          currentPrice,
          priceChange: null, // Will be calculated separately if needed
          priceChangePercent: null,
          source: `Quote (${quoteResult.sourceLabel})`,
          timestamp: quoteResult.timestamp,
          isValidated: false,
          validationWarning:
            'Using quote API - price may be less accurate than last trading session close',
        };
      } catch (quoteError) {
        throw new Error(
          `Failed to get price for ${symbol}. All data sources (chart and quote) failed. This may be due to API authentication issues or invalid symbol.`
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price change data for a specific timeframe
   * Uses chart data to calculate accurate price movements
   */
  async getPriceChangeData(
    symbol: string,
    timeRange: TimeRange = '5D'
  ): Promise<{
    priceChange: number | null;
    priceChangePercent: number | null;
    source: string;
  }> {
    try {
      const chartResult = await dataProvider.getChartData(symbol, timeRange);
      if (chartResult.data && chartResult.data.length >= 2) {
        const firstPrice = chartResult.data[0].close;
        const lastPrice = chartResult.data[chartResult.data.length - 1].close;

        const priceChange = lastPrice - firstPrice;
        const priceChangePercent = (priceChange / firstPrice) * 100;

        return {
          priceChange,
          priceChangePercent,
          source: `Chart ${timeRange} (${chartResult.sourceLabel})`,
        };
      }

      return {
        priceChange: null,
        priceChangePercent: null,
        source: 'Insufficient data',
      };
    } catch (error) {
      return {
        priceChange: null,
        priceChangePercent: null,
        source: 'Error',
      };
    }
  }

  /**
   * Compare prices from different sources and detect discrepancies
   */
  async validatePriceConsistency(symbol: string): Promise<{
    isConsistent: boolean;
    chartPrice?: number;
    quotePrice?: number;
    discrepancyPercent?: number;
    warning?: string;
  }> {
    try {
      let chartPrice: number | undefined;
      let quotePrice: number | undefined;

      // Get chart price
      try {
        const chartResult = await dataProvider.getChartData(symbol, '5D');
        if (chartResult.data && chartResult.data.length > 0) {
          chartPrice = chartResult.data[chartResult.data.length - 1].close;
        }
      } catch (error) {
        // Chart price fetch failed for validation
      }

      // Get quote price
      try {
        const quoteResult = await dataProvider.getQuote(symbol);
        quotePrice = quoteResult.price;
      } catch (error) {
        // Quote price fetch failed for validation
      }

      // Compare if both are available
      if (chartPrice && quotePrice) {
        const discrepancyPercent = Math.abs((quotePrice - chartPrice) / chartPrice) * 100;
        const isConsistent = discrepancyPercent < 5; // Less than 5% difference is considered consistent

        const result = {
          isConsistent,
          chartPrice,
          quotePrice,
          discrepancyPercent,
          warning: isConsistent
            ? undefined
            : `Price discrepancy detected: Chart $${chartPrice.toFixed(2)} vs Quote $${quotePrice.toFixed(2)} (${discrepancyPercent.toFixed(1)}% difference)`,
        };

        return result;
      }

      return {
        isConsistent: true, // Can't validate if we don't have both prices
      };
    } catch (error) {
      return {
        isConsistent: false,
        warning: 'Price validation failed',
      };
    }
  }
}

export const priceService = new PriceService();
