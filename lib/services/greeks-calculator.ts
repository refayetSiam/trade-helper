// Simple Black-Scholes implementation without external dependencies
export interface GreeksCalculation {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  price: number;
  intrinsicValue: number;
  timeValue: number;
}

export interface BlackScholesInputs {
  stockPrice: number;
  strikePrice: number;
  timeToExpiry: number; // in years
  riskFreeRate: number; // as decimal (e.g., 0.05 for 5%)
  volatility: number; // as decimal (e.g., 0.20 for 20%)
  dividendYield?: number; // as decimal
}

export interface CoveredCallAnalysis {
  costOfBorrowing: number;
  maxProfit: number;
  maxLoss: number;
  netProfit: number;
  annualizedReturn: number;
  breakeven: number;
  daysToExpiry: number;
  probabilityOfProfit: number;
}

class GreeksCalculatorService {
  /**
   * Get current risk-free rate (simplified - in practice would fetch from Fed)
   */
  getRiskFreeRate(): number {
    return 0.05; // 5% simplified rate
  }

  /**
   * Calculate time to expiry in years
   */
  calculateTimeToExpiry(expirationDate: Date): number {
    const now = new Date();
    const timeInMs = expirationDate.getTime() - now.getTime();
    const timeInDays = timeInMs / (1000 * 60 * 60 * 24);
    return Math.max(timeInDays / 365, 0.0027); // Minimum 1 day
  }

  /**
   * Standard normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Standard normal probability density function
   */
  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Calculate d1 and d2 for Black-Scholes formula
   */
  private calculateD1D2(inputs: BlackScholesInputs): { d1: number; d2: number } {
    const {
      stockPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      dividendYield = 0,
    } = inputs;

    const d1 =
      (Math.log(stockPrice / strikePrice) +
        (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) /
      (volatility * Math.sqrt(timeToExpiry));

    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    return { d1, d2 };
  }

  /**
   * Calculate Black-Scholes option price and Greeks
   */
  calculateGreeks(
    inputs: BlackScholesInputs,
    optionType: 'call' | 'put' = 'call'
  ): GreeksCalculation {
    const {
      stockPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      dividendYield = 0,
    } = inputs;
    const { d1, d2 } = this.calculateD1D2(inputs);

    const Nd1 = this.normalCDF(d1);
    const Nd2 = this.normalCDF(d2);
    const nd1 = this.normalPDF(d1);

    let price: number;
    let delta: number;
    let intrinsicValue: number;

    if (optionType === 'call') {
      price =
        stockPrice * Math.exp(-dividendYield * timeToExpiry) * Nd1 -
        strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2;
      delta = Math.exp(-dividendYield * timeToExpiry) * Nd1;
      intrinsicValue = Math.max(stockPrice - strikePrice, 0);
    } else {
      price =
        strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2) -
        stockPrice * Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(-d1);
      delta = -Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(-d1);
      intrinsicValue = Math.max(strikePrice - stockPrice, 0);
    }

    // Greeks calculations
    const gamma =
      (Math.exp(-dividendYield * timeToExpiry) * nd1) /
      (stockPrice * volatility * Math.sqrt(timeToExpiry));

    const theta =
      optionType === 'call'
        ? ((-stockPrice * nd1 * volatility * Math.exp(-dividendYield * timeToExpiry)) /
            (2 * Math.sqrt(timeToExpiry)) -
            riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2 +
            dividendYield * stockPrice * Math.exp(-dividendYield * timeToExpiry) * Nd1) /
          365
        : ((-stockPrice * nd1 * volatility * Math.exp(-dividendYield * timeToExpiry)) /
            (2 * Math.sqrt(timeToExpiry)) +
            riskFreeRate *
              strikePrice *
              Math.exp(-riskFreeRate * timeToExpiry) *
              this.normalCDF(-d2) -
            dividendYield *
              stockPrice *
              Math.exp(-dividendYield * timeToExpiry) *
              this.normalCDF(-d1)) /
          365;

    const vega =
      (stockPrice * Math.exp(-dividendYield * timeToExpiry) * nd1 * Math.sqrt(timeToExpiry)) / 100;

    const rho =
      optionType === 'call'
        ? (strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * Nd2) / 100
        : (-strikePrice *
            timeToExpiry *
            Math.exp(-riskFreeRate * timeToExpiry) *
            this.normalCDF(-d2)) /
          100;

    const timeValue = price - intrinsicValue;

    return {
      delta,
      gamma,
      theta,
      vega,
      rho,
      price,
      intrinsicValue,
      timeValue,
    };
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  calculateImpliedVolatility(
    marketPrice: number,
    stockPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    optionType: 'call' | 'put' = 'call',
    dividendYield: number = 0
  ): number {
    // Sanity checks
    if (marketPrice <= 0 || stockPrice <= 0 || strikePrice <= 0 || timeToExpiry <= 0) {
      return 0.2; // Return 20% as default for invalid inputs
    }

    // For deep out-of-the-money options with very low prices, use a default IV
    const intrinsicValue =
      optionType === 'call'
        ? Math.max(stockPrice - strikePrice, 0)
        : Math.max(strikePrice - stockPrice, 0);

    if (marketPrice < intrinsicValue) {
      return 0.2; // Option price below intrinsic value, use default
    }

    let volatility = 0.3; // Initial guess
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const inputs: BlackScholesInputs = {
        stockPrice,
        strikePrice,
        timeToExpiry,
        riskFreeRate,
        volatility,
        dividendYield,
      };

      const greeks = this.calculateGreeks(inputs, optionType);
      const priceDiff = greeks.price - marketPrice;

      if (Math.abs(priceDiff) < tolerance) {
        // Cap volatility at reasonable bounds (1% to 500%)
        return Math.min(Math.max(volatility, 0.01), 5.0);
      }

      // Newton-Raphson update
      const vega = greeks.vega;
      if (Math.abs(vega) < 0.00001) break; // Vega too small, stop iteration

      const adjustment = priceDiff / (vega * 100);

      // Limit the adjustment size to prevent huge jumps
      const maxAdjustment = 0.5;
      const clampedAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

      volatility = volatility - clampedAdjustment;

      // Keep volatility within reasonable bounds during iteration
      volatility = Math.min(Math.max(volatility, 0.01), 5.0);
    }

    // If we couldn't converge, return a reasonable default based on moneyness
    const moneyness = stockPrice / strikePrice;
    if (moneyness < 0.8 || moneyness > 1.2) {
      return 0.4; // Higher IV for options far from ATM
    }

    return 0.3; // Default 30% IV
  }

  /**
   * Analyze covered call opportunity with updated formulas
   *
   * Variables:
   * S = Stock purchase price (stockPrice)
   * K = Strike price (strikePrice)
   * P = Premium received per share (marketOptionPrice or greeks.price)
   * T = Time to expiration in days
   * R_borrow = Borrowing interest rate as decimal (locRate / 100)
   */
  analyzeCoveredCall(
    inputs: BlackScholesInputs,
    locRate: number,
    marketOptionPrice?: number
  ): CoveredCallAnalysis {
    const { stockPrice, strikePrice, timeToExpiry, volatility } = inputs;
    const greeks = this.calculateGreeks(inputs, 'call');

    // Variable assignments per specification
    const S = stockPrice; // Stock purchase price
    const K = strikePrice; // Strike price
    const P = marketOptionPrice || greeks.price; // Premium received per share
    const T = Math.round(timeToExpiry * 365); // Time to expiration in days
    const R_borrow = locRate / 100; // Borrowing rate as decimal

    // 💸 Borrowing Interest Cost
    // InterestCost = (S × 100) × R_borrow × (T / 365)
    const InterestCost = S * 100 * R_borrow * (T / 365);

    // 📈 Covered Call Max Profit
    // MaxProfit = (min(K – S, 0) + P) × 100 – InterestCost
    const MaxProfit = (Math.min(K - S, 0) + P) * 100 - InterestCost;

    // 📅 Annualized Return
    // AnnualizedReturn = (MaxProfit / (S × 100)) × (365 / T) × 100
    const AnnualizedReturn = T > 0 ? (MaxProfit / (S * 100)) * (365 / T) * 100 : 0;

    // 🔄 Break-even Price
    // BreakEven = S – P
    const BreakEven = S - P;

    // Maximum loss (if stock goes to zero)
    // You lose the full stock investment minus premium collected
    const maxLoss = S * 100 - P * 100 - InterestCost;

    // FIXED: Probability of profit calculation
    // Covered call is profitable when final stock price > breakeven price
    const logRatio = Math.log(BreakEven / S);
    const denominator = volatility * Math.sqrt(timeToExpiry);
    const zScore = logRatio / denominator;
    const probabilityOfProfit = (1 - this.normalCDF(zScore)) * 100;

    return {
      costOfBorrowing: InterestCost,
      maxProfit: MaxProfit,
      maxLoss,
      netProfit: MaxProfit, // Use MaxProfit as the net profit
      annualizedReturn: AnnualizedReturn,
      breakeven: BreakEven,
      daysToExpiry: T,
      probabilityOfProfit,
    };
  }
}

export const greeksCalculatorService = new GreeksCalculatorService();
