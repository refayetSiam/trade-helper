export interface ChartDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
  index?: number;
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
  rsi?: (number | null)[];
  macd?: {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  };
  sma?: {
    sma20?: (number | null)[];
    sma50?: (number | null)[];
    sma200?: (number | null)[];
  };
  ema?: {
    ema12?: (number | null)[];
    ema26?: (number | null)[];
  };
  bollingerBands?: {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
  };
  stochastic?: {
    k: (number | null)[];
    d: (number | null)[];
  };
  atr?: (number | null)[];
  adx?: (number | null)[];
  obv?: (number | null)[];
  vwap?: (number | null)[];
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
        return '1h'; // Use hourly data for 5-day range
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

    // Fill initial values with null - cast to maintain array type
    for (let i = 0; i < period; i++) {
      rsi.push(null as any);
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

    const macd: (number | null)[] = [];
    const signal: (number | null)[] = [];
    const histogram: (number | null)[] = [];

    // Calculate MACD line
    for (let i = 0; i < closes.length; i++) {
      if (i < slowPeriod - 1) {
        macd.push(null);
      } else {
        const ema12Val = ema12[i];
        const ema26Val = ema26[i];
        if (ema12Val !== null && ema26Val !== null) {
          macd.push(ema12Val - ema26Val);
        } else {
          macd.push(null);
        }
      }
    }

    // Calculate signal line (EMA of MACD)
    const signalLine = this.calculateEMA(macd.filter(v => v !== null) as number[], signalPeriod);

    // Pad signal line
    for (let i = 0; i < slowPeriod - 1; i++) {
      signal.push(null);
    }
    signal.push(...signalLine);

    // Calculate histogram
    for (let i = 0; i < closes.length; i++) {
      if (i < slowPeriod - 1) {
        histogram.push(null);
      } else {
        const macdVal = macd[i];
        const signalVal = signal[i];
        if (macdVal !== null && signalVal !== null) {
          histogram.push(macdVal - signalVal);
        } else {
          histogram.push(null);
        }
      }
    }

    return { macd, signal, histogram };
  }

  // Calculate Simple Moving Average
  static calculateSMA(data: number[], period: number): (number | null)[] {
    const sma: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }

    return sma;
  }

  // Calculate Exponential Moving Average
  static calculateEMA(data: number[], period: number): (number | null)[] {
    const ema: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
      if (i < period - 1) {
        ema.push(null);
      } else {
        ema.push(sum / period);
      }
    }

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
      const prevEma = ema[i - 1];
      if (prevEma !== null) {
        ema.push((data[i] - prevEma) * multiplier + prevEma);
      } else {
        ema.push(null);
      }
    }

    return ema;
  }

  // Calculate Bollinger Bands
  static calculateBollingerBands(data: ChartDataPoint[], period = 20, stdDev = 2) {
    const closes = data.map(d => d.close);
    const middle = this.calculateSMA(closes, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
      } else {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = middle[i];
        if (mean !== null) {
          const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
          const std = Math.sqrt(variance);

          upper.push(mean + stdDev * std);
          lower.push(mean - stdDev * std);
        } else {
          upper.push(null);
          lower.push(null);
        }
      }
    }

    return { upper, middle, lower };
  }

  // Calculate Stochastic Oscillator
  static calculateStochastic(data: ChartDataPoint[], kPeriod = 14, dPeriod = 3) {
    const k: (number | null)[] = [];
    const d: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < kPeriod - 1) {
        k.push(null);
      } else {
        const slice = data.slice(i - kPeriod + 1, i + 1);
        const high = Math.max(...slice.map(d => d.high));
        const low = Math.min(...slice.map(d => d.low));
        const close = data[i].close;

        k.push(((close - low) / (high - low)) * 100);
      }
    }

    // Calculate %D (SMA of %K)
    const dValues = this.calculateSMA(k.filter(v => v !== null) as number[], dPeriod);

    // Pad D values
    for (let i = 0; i < kPeriod - 1; i++) {
      d.push(null);
    }
    d.push(...dValues);

    return { k, d };
  }

  // Calculate On-Balance Volume (OBV)
  static calculateOBV(data: ChartDataPoint[]): (number | null)[] {
    const obv: (number | null)[] = [0]; // Starting with 0 is correct for OBV baseline

    for (let i = 1; i < data.length; i++) {
      const prevObv = obv[i - 1];
      if (prevObv !== null) {
        if (data[i].close > data[i - 1].close) {
          obv.push(prevObv + data[i].volume);
        } else if (data[i].close < data[i - 1].close) {
          obv.push(prevObv - data[i].volume);
        } else {
          obv.push(prevObv);
        }
      } else {
        obv.push(null);
      }
    }

    return obv;
  }

  // Calculate VWAP (Volume Weighted Average Price)
  static calculateVWAP(data: ChartDataPoint[]): (number | null)[] {
    const vwap: (number | null)[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      cumulativeTPV += typicalPrice * data[i].volume;
      cumulativeVolume += data[i].volume;

      vwap.push(cumulativeVolume === 0 ? null : cumulativeTPV / cumulativeVolume);
    }

    return vwap;
  }

  // Calculate ATR (Average True Range)
  static calculateATR(data: ChartDataPoint[], period = 14): (number | null)[] {
    const atr: (number | null)[] = [];
    const trueRanges: number[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        // First TR is just high - low
        trueRanges.push(data[i].high - data[i].low);
        atr.push(null);
      } else {
        // True Range = max(high - low, abs(high - prevClose), abs(low - prevClose))
        const highLow = data[i].high - data[i].low;
        const highClose = Math.abs(data[i].high - data[i - 1].close);
        const lowClose = Math.abs(data[i].low - data[i - 1].close);
        const tr = Math.max(highLow, highClose, lowClose);
        trueRanges.push(tr);

        if (i < period) {
          atr.push(null);
        } else if (i === period) {
          // First ATR is simple average of first period TRs
          const avgTR = trueRanges.slice(1, period + 1).reduce((sum, tr) => sum + tr, 0) / period;
          atr.push(avgTR);
        } else {
          // Smoothed ATR: (previousATR * (period - 1) + currentTR) / period
          const prevATR = atr[i - 1];
          const currentTR = trueRanges[i];
          if (prevATR !== null) {
            const smoothedATR = (prevATR * (period - 1) + currentTR) / period;
            atr.push(smoothedATR);
          } else {
            atr.push(null);
          }
        }
      }
    }

    return atr;
  }

  // Calculate Volume Moving Average
  static calculateVolumeMA(data: ChartDataPoint[], period = 20): (number | null)[] {
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
