export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  pe?: number;
  eps?: number;
  beta?: number;
}

export interface TechnicalIndicators {
  rsi?: number;
  rsi14?: number;
  rsi21?: number;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  stochastic?: {
    k: number;
    d: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages?: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema9: number;
    ema21: number;
    ema55: number;
  };
  adx?: number;
  atr?: number;
  vwap?: number;
  obv?: number;
}

export interface TradeRecommendation {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
  riskRewardRatio: number;
  reason: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: 'PRICE' | 'TECHNICAL' | 'PATTERN' | 'OPTIONS';
  condition: string;
  value: number;
  active: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OptionContract {
  symbol: string;
  strike: number;
  expiration: Date;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

export interface CoveredCallRecommendation {
  stock: Stock;
  option: OptionContract;
  potentialReturn: number;
  potentialReturnIfCalled: number;
  breakEven: number;
  probabilityOfProfit: number;
  ivRank: number;
  daysToExpiration: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'AVOID';
  reasons: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailAlerts: boolean;
  alertFrequency: 'instant' | 'hourly' | 'daily';
  defaultWatchlistId?: string;
  defaultChartInterval: string;
}