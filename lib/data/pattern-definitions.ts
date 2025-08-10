export interface PatternDefinition {
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
  howItWorks: string;
  example: string;
  probability: string;
  tradingStyle: string;
  whenToUse: string;
}

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    name: 'Doji',
    signal: 'neutral',
    description:
      'A candle where open and close prices are nearly equal, creating a cross-like shape.',
    howItWorks:
      'Shows market indecision. Buyers and sellers are in equilibrium, neither side has control.',
    example:
      'Stock opens at $100, trades between $98-$102, but closes at $100.10. The tiny body shows indecision.',
    probability: '50% (neutral - watch for next candle)',
    tradingStyle: 'Intraday (wait for confirmation)',
    whenToUse: 'At support/resistance levels or after strong trends to signal potential reversal.',
  },
  {
    name: 'Bullish Engulfing',
    signal: 'bullish',
    description: 'A large green candle completely engulfs the previous red candle.',
    howItWorks:
      "Shows buyers overwhelming sellers. The green candle opens below the red candle's close but closes above its open.",
    example:
      "Day 1: Stock falls from $105 to $100. Day 2: Opens at $99 but closes at $107, engulfing yesterday's red candle.",
    probability: '68% win rate',
    tradingStyle: 'Swing trading (2-10 days)',
    whenToUse: 'After downtrends or at support levels for reversal signals.',
  },
  {
    name: 'Bearish Engulfing',
    signal: 'bearish',
    description: 'A large red candle completely engulfs the previous green candle.',
    howItWorks:
      "Shows sellers overwhelming buyers. The red candle opens above the green candle's close but closes below its open.",
    example:
      "Day 1: Stock rises from $100 to $105. Day 2: Opens at $106 but closes at $98, engulfing yesterday's green candle.",
    probability: '65% win rate',
    tradingStyle: 'Swing trading (2-10 days)',
    whenToUse: 'After uptrends or at resistance levels for reversal signals.',
  },
  {
    name: 'Hammer',
    signal: 'bullish',
    description:
      'A candle with a small body at the top and a long lower shadow (2x+ the body size).',
    howItWorks:
      'Shows rejection of lower prices. Sellers pushed price down but buyers stepped in strongly.',
    example:
      'Stock opens at $100, falls to $95, but closes at $99. The long lower shadow shows buyer support.',
    probability: '59% win rate',
    tradingStyle: 'Swing trading',
    whenToUse: 'After downtrends or at support levels, especially with volume confirmation.',
  },
  {
    name: 'Shooting Star',
    signal: 'bearish',
    description:
      'A candle with a small body at the bottom and a long upper shadow (2x+ the body size).',
    howItWorks:
      'Shows rejection of higher prices. Buyers pushed price up but sellers stepped in strongly.',
    example:
      'Stock opens at $100, rises to $105, but closes at $101. The long upper shadow shows seller resistance.',
    probability: '57% win rate',
    tradingStyle: 'Swing trading',
    whenToUse: 'After uptrends or at resistance levels, especially with volume confirmation.',
  },
  {
    name: 'Morning Star',
    signal: 'bullish',
    description: '3-candle bullish reversal pattern with gap down then gap up.',
    howItWorks:
      'First candle is bearish, second is small-bodied (doji/spinning top), third is bullish with strong close.',
    example:
      'Day 1: Red candle closes at $95. Day 2: Small body between $93-$94. Day 3: Green candle opens at $96, closes at $102.',
    probability: '70.1% win rate',
    tradingStyle: 'Swing trading (3-7 days)',
    whenToUse: 'After downtrends, especially near support levels with volume confirmation.',
  },
  {
    name: 'Evening Star',
    signal: 'bearish',
    description: '3-candle bearish reversal pattern with gap up then gap down.',
    howItWorks:
      'First candle is bullish, second is small-bodied (doji/spinning top), third is bearish with strong close.',
    example:
      'Day 1: Green candle closes at $105. Day 2: Small body between $106-$107. Day 3: Red candle opens at $104, closes at $98.',
    probability: '69.4% win rate',
    tradingStyle: 'Swing trading (3-7 days)',
    whenToUse: 'After uptrends, especially near resistance levels with volume confirmation.',
  },
  {
    name: 'Inside Bar',
    signal: 'neutral',
    description: 'Current candle is completely within the range of the previous candle.',
    howItWorks:
      'Shows consolidation and reduced volatility. Often precedes a strong directional move.',
    example:
      'Day 1: Candle ranges from $95-$105. Day 2: Candle ranges from $98-$102 (completely inside Day 1).',
    probability: '71.6% win rate with volume confirmation',
    tradingStyle: 'Swing trading (breakout play)',
    whenToUse: 'Wait for breakout direction with volume. Trade the breakout direction.',
  },
  {
    name: 'Marubozu',
    signal: 'bullish',
    description: 'A candle with little to no upper or lower shadows, showing strong momentum.',
    howItWorks:
      'Price opens at or near low, closes at or near high (bullish) or vice versa (bearish).',
    example:
      'Bullish: Stock opens at $100, trades to $110, closes at $109.90. No significant rejection of prices.',
    probability: 'Strong continuation signal',
    tradingStyle: 'Swing trading (trend continuation)',
    whenToUse: 'In established trends to confirm momentum continuation.',
  },
  {
    name: 'Golden Cross',
    signal: 'bullish',
    description: 'When 50-day moving average crosses above 200-day moving average.',
    howItWorks:
      'Signals long-term trend change from bearish to bullish. Institutional money often follows.',
    example:
      '50-day MA at $148 crosses above 200-day MA at $147. Confirms longer-term uptrend beginning.',
    probability: '76% win rate',
    tradingStyle: 'Position trading (weeks to months)',
    whenToUse: 'For long-term bullish positions when major trend changes occur.',
  },
  {
    name: 'Death Cross',
    signal: 'bearish',
    description: 'When 50-day moving average crosses below 200-day moving average.',
    howItWorks:
      'Signals long-term trend change from bullish to bearish. Often leads to extended declines.',
    example:
      '50-day MA at $152 crosses below 200-day MA at $153. Confirms longer-term downtrend beginning.',
    probability: 'Strong bearish signal',
    tradingStyle: 'Position trading (weeks to months)',
    whenToUse: 'For long-term bearish positions or to avoid long positions.',
  },
  {
    name: 'RSI Divergence',
    signal: 'bullish',
    description: 'Price makes lower lows while RSI makes higher lows (bullish divergence).',
    howItWorks:
      'Shows weakening selling pressure despite price decline. Momentum is shifting bullish.',
    example:
      'Stock drops to $95 (RSI 25), then to $93 (RSI 30). Lower price but higher RSI shows divergence.',
    probability: '72.5% win rate',
    tradingStyle: 'Swing trading (3-10 days)',
    whenToUse: 'Near support levels when momentum indicators disagree with price action.',
  },
  {
    name: 'MACD Bullish Cross',
    signal: 'bullish',
    description: 'MACD line crosses above signal line, especially from negative territory.',
    howItWorks:
      'Shows acceleration of bullish momentum. Histogram turns positive, confirming trend change.',
    example: 'MACD at -0.5 crosses above signal at -0.3. Histogram goes from negative to positive.',
    probability: '68.4% win rate',
    tradingStyle: 'Swing trading (5-15 days)',
    whenToUse: 'When combined with price breaking above key resistance levels.',
  },
  {
    name: 'Support Bounce',
    signal: 'bullish',
    description: 'Price bounces off a well-established support level with volume.',
    howItWorks:
      'Support level holds, buyers step in aggressively. Volume confirms institutional interest.',
    example: 'Stock tests $95 support (3rd touch), bounces to $98 on 2x average volume.',
    probability: 'Depends on support strength',
    tradingStyle: 'Swing trading (3-10 days)',
    whenToUse:
      'At established support levels with volume confirmation and bullish candle patterns.',
  },
  {
    name: 'Resistance Rejection',
    signal: 'bearish',
    description: 'Price fails to break through established resistance, often with volume.',
    howItWorks:
      'Resistance level holds, sellers step in aggressively. Shows distribution at key levels.',
    example:
      'Stock tests $105 resistance (4th touch), reverses to $102 on high volume with long upper shadow.',
    probability: 'Depends on resistance strength',
    tradingStyle: 'Swing trading (3-10 days)',
    whenToUse: 'At established resistance levels with volume and bearish reversal patterns.',
  },
  {
    name: 'Volume Breakout',
    signal: 'bullish',
    description: 'Price breaks key level with significantly higher than average volume.',
    howItWorks: 'Volume confirms breakout validity. Shows institutional participation in the move.',
    example:
      'Stock breaks $100 resistance on 3x average volume, closing at $103. Volume validates breakout.',
    probability: 'High probability with volume',
    tradingStyle: 'Swing trading (breakout follow-through)',
    whenToUse: 'When price breaks key levels with volume 2x+ average and closes strong.',
  },
  {
    name: 'Gap Up',
    signal: 'bullish',
    description: 'Stock opens significantly higher than previous close, often on news.',
    howItWorks:
      'Shows strong overnight demand. Gaps often get filled but can lead to trend continuation.',
    example: 'Stock closes at $95, opens next day at $98.50 on earnings news. 3.7% gap up.',
    probability: '60-80% depending on volume',
    tradingStyle: 'Intraday to swing trading',
    whenToUse: 'Trade gap fill or continuation based on volume and market context.',
  },
  {
    name: 'Cup and Handle',
    signal: 'bullish',
    description: 'U-shaped consolidation followed by smaller flag-like consolidation.',
    howItWorks: 'Shows accumulation pattern. Handle provides final shakeout before breakout.',
    example:
      'Stock forms cup from $100 to $80 back to $100, then handle from $100 to $95, breaks to $110.',
    probability: '76.1% win rate',
    tradingStyle: 'Position trading (weeks to months)',
    whenToUse: 'When handle completes on lower volume and breaks cup high on volume.',
  },
  {
    name: 'Triple Top',
    signal: 'bearish',
    description: 'Price tests same resistance level three times and fails to break through.',
    howItWorks: 'Shows strong resistance and weakening buying pressure at key level.',
    example:
      'Stock hits $105 three times over 2 months, fails each time, then breaks $100 support.',
    probability: 'Strong reversal pattern',
    tradingStyle: 'Position trading (trend reversal)',
    whenToUse: 'When neckline support breaks with volume after third rejection.',
  },
  {
    name: 'Ascending Triangle',
    signal: 'bullish',
    description: 'Horizontal resistance with rising support trendline.',
    howItWorks: 'Shows buyers becoming more aggressive while resistance holds. Building pressure.',
    example:
      'Stock bounces off rising support at $95, $97, $99 while hitting $105 resistance repeatedly.',
    probability: '70%+ breakout probability',
    tradingStyle: 'Swing to position trading',
    whenToUse: 'Trade breakout above resistance with volume confirmation.',
  },
];
