export interface ChartDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface DataFreshnessInfo {
  isStale: boolean;
  daysBehind: number;
  lastDataDate: string;
  expectedDataDate: string;
  warningMessage?: string;
}

export interface ChartDataWithFreshness {
  data: ChartDataPoint[];
  freshness: DataFreshnessInfo;
}

export interface TechnicalIndicators {
  rsi?: number[];
  macd?: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  sma?: {
    sma20?: number[];
    sma50?: number[];
    sma200?: number[];
  };
  ema?: {
    ema12?: number[];
    ema26?: number[];
  };
  bollingerBands?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  stochastic?: {
    k: number[];
    d: number[];
  };
  atr?: number[];
  adx?: number[];
  obv?: number[];
  vwap?: number[];
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '2Y' | '5Y' | 'MAX';
export type ChartType = 'line' | 'candlestick' | 'area' | 'bar';
export type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1wk' | '1mo';

export class ChartDataService {
  static async fetchChartData(
    symbol: string,
    range: TimeRange,
    interval?: Interval
  ): Promise<ChartDataWithFreshness> {
    try {
      // Determine interval based on range if not provided
      const finalInterval = interval || this.getDefaultInterval(range);

      const response = await fetch(
        `/api/chart-data?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${finalInterval}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }

      const result = await response.json();

      // Transform date strings back to Date objects
      const chartData = result.data.map((point: any) => ({
        ...point,
        date: new Date(point.date),
      }));

      return {
        data: chartData,
        freshness: result.freshness,
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  static async fetchChartDataLegacy(
    symbol: string,
    range: TimeRange,
    interval?: Interval
  ): Promise<ChartDataPoint[]> {
    const result = await this.fetchChartData(symbol, range, interval);
    return result.data;
  }

  private static getDefaultInterval(range: TimeRange): Interval {
    switch (range) {
      case '1D':
        return '5m';
      case '5D':
        return '1d';
      case '1M':
      case '3M':
      case '6M':
      case 'YTD':
        return '1d';
      case '1Y':
      case '2Y':
      case '5Y':
      case 'MAX':
        return '1wk';
      default:
        return '1d';
    }
  }

  // Calculate RSI
  static calculateRSI(data: ChartDataPoint[], period: number = 14): number[] {
    const closes = data.map(d => d.close);
    const rsi: number[] = [];

    if (closes.length < period + 1) return rsi;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Fill initial values with null
    for (let i = 0; i < period; i++) {
      rsi.push(0);
    }

    // Calculate RSI
    for (let i = period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];

      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    return rsi;
  }

  // Calculate MACD
  static calculateMACD(data: ChartDataPoint[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const closes = data.map(d => d.close);
    const ema12 = this.calculateEMA(closes, fastPeriod);
    const ema26 = this.calculateEMA(closes, slowPeriod);

    const macd: number[] = [];
    const signal: number[] = [];
    const histogram: number[] = [];

    // Calculate MACD line
    for (let i = 0; i < closes.length; i++) {
      if (i < slowPeriod - 1) {
        macd.push(0);
      } else {
        macd.push(ema12[i] - ema26[i]);
      }
    }

    // Calculate signal line (EMA of MACD)
    const signalLine = this.calculateEMA(
      macd.filter(v => v !== 0),
      signalPeriod
    );

    // Pad signal line
    for (let i = 0; i < slowPeriod - 1; i++) {
      signal.push(0);
    }
    signal.push(...signalLine);

    // Calculate histogram
    for (let i = 0; i < closes.length; i++) {
      if (i < slowPeriod - 1) {
        histogram.push(0);
      } else {
        histogram.push(macd[i] - signal[i]);
      }
    }

    return { macd, signal, histogram };
  }

  // Calculate Simple Moving Average
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(0);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }

    return sma;
  }

  // Calculate Exponential Moving Average
  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
      if (i < period - 1) {
        ema.push(0);
      } else {
        ema.push(sum / period);
      }
    }

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }

    return ema;
  }

  // Calculate Bollinger Bands
  static calculateBollingerBands(data: ChartDataPoint[], period = 20, stdDev = 2) {
    const closes = data.map(d => d.close);
    const middle = this.calculateSMA(closes, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        upper.push(0);
        lower.push(0);
      } else {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);

        upper.push(mean + stdDev * std);
        lower.push(mean - stdDev * std);
      }
    }

    return { upper, middle, lower };
  }

  // Calculate Stochastic Oscillator
  static calculateStochastic(data: ChartDataPoint[], kPeriod = 14, dPeriod = 3) {
    const k: number[] = [];
    const d: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod - 1) {
        k.push(0);
      } else {
        const slice = data.slice(i - kPeriod + 1, i + 1);
        const high = Math.max(...slice.map(d => d.high));
        const low = Math.min(...slice.map(d => d.low));
        const close = data[i].close;

        k.push(((close - low) / (high - low)) * 100);
      }
    }

    // Calculate %D (SMA of %K)
    const dValues = this.calculateSMA(
      k.filter(v => v !== 0),
      dPeriod
    );

    // Pad D values
    for (let i = 0; i < kPeriod - 1; i++) {
      d.push(0);
    }
    d.push(...dValues);

    return { k, d };
  }

  // Calculate On-Balance Volume (OBV)
  static calculateOBV(data: ChartDataPoint[]): number[] {
    const obv: number[] = [0];

    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv.push(obv[i - 1] + data[i].volume);
      } else if (data[i].close < data[i - 1].close) {
        obv.push(obv[i - 1] - data[i].volume);
      } else {
        obv.push(obv[i - 1]);
      }
    }

    return obv;
  }

  // Calculate VWAP (Volume Weighted Average Price)
  static calculateVWAP(data: ChartDataPoint[]): number[] {
    const vwap: number[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      cumulativeTPV += typicalPrice * data[i].volume;
      cumulativeVolume += data[i].volume;

      vwap.push(cumulativeVolume === 0 ? 0 : cumulativeTPV / cumulativeVolume);
    }

    return vwap;
  }

  // Calculate ATR (Average True Range)
  static calculateATR(data: ChartDataPoint[], period = 14): number[] {
    const atr: number[] = [];
    const trueRanges: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        // First TR is just high - low
        trueRanges.push(data[i].high - data[i].low);
        atr.push(0);
      } else {
        // True Range = max(high - low, abs(high - prevClose), abs(low - prevClose))
        const highLow = data[i].high - data[i].low;
        const highClose = Math.abs(data[i].high - data[i - 1].close);
        const lowClose = Math.abs(data[i].low - data[i - 1].close);
        const tr = Math.max(highLow, highClose, lowClose);
        trueRanges.push(tr);

        if (i < period) {
          atr.push(0);
        } else if (i === period) {
          // First ATR is simple average of first period TRs
          const avgTR = trueRanges.slice(1, period + 1).reduce((sum, tr) => sum + tr, 0) / period;
          atr.push(avgTR);
        } else {
          // Smoothed ATR: (previousATR * (period - 1) + currentTR) / period
          const prevATR = atr[i - 1];
          const currentTR = trueRanges[i];
          const smoothedATR = (prevATR * (period - 1) + currentTR) / period;
          atr.push(smoothedATR);
        }
      }
    }

    return atr;
  }

  // Calculate Volume Moving Average
  static calculateVolumeMA(data: ChartDataPoint[], period = 20): number[] {
    const volumes = data.map(d => d.volume);
    return this.calculateSMA(volumes, period);
  }

  // Calculate all indicators
  static calculateAllIndicators(data: ChartDataPoint[]): TechnicalIndicators {
    const closes = data.map(d => d.close);

    return {
      rsi: this.calculateRSI(data),
      macd: this.calculateMACD(data),
      sma: {
        sma20: this.calculateSMA(closes, 20),
        sma50: this.calculateSMA(closes, 50),
        sma200: this.calculateSMA(closes, 200),
      },
      ema: {
        ema12: this.calculateEMA(closes, 12),
        ema26: this.calculateEMA(closes, 26),
      },
      bollingerBands: this.calculateBollingerBands(data),
      stochastic: this.calculateStochastic(data),
      atr: this.calculateATR(data, 14),
      obv: this.calculateOBV(data),
      vwap: this.calculateVWAP(data),
    };
  }
}
