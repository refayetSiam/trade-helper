'use client';

import React, { useState } from 'react';
import { HelpCircle, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PatternDefinition {
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
  howItWorks: string;
  example: string;
  probability: string;
  tradingStyle: string;
  whenToUse: string;
}

const PATTERN_DEFINITIONS: PatternDefinition[] = [
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
    name: 'Golden Cross + Pullback',
    signal: 'bullish',
    description:
      'When 50-day MA crosses above 200-day MA, then price bounces off 50-day MA support.',
    howItWorks:
      'Long-term trend change confirmed by institutional money. Pullback provides good entry point.',
    example:
      '50-day MA at $150 crosses above 200-day MA at $148. Stock pulls back to $151 (near 50-day MA) then bounces.',
    probability: '76% win rate',
    tradingStyle: 'Position trading (weeks to months)',
    whenToUse: 'For long-term bullish positions when major trend changes occur.',
  },
  {
    name: 'Death Cross + Failed Rally',
    signal: 'bearish',
    description: 'When 50-day MA crosses below 200-day MA, then price fails to reclaim 50-day MA.',
    howItWorks: 'Long-term trend change to bearish. Failed rally shows sellers are in control.',
    example:
      '50-day MA at $145 crosses below 200-day MA at $147. Stock rallies to $144 but fails to reach 50-day MA.',
    probability: '74% win rate',
    tradingStyle: 'Position trading (weeks to months)',
    whenToUse: 'For long-term bearish positions or to exit long positions.',
  },
  {
    name: 'Breakout + Volume Surge',
    signal: 'bullish',
    description: 'Price breaks above resistance with volume 1.5x+ the average.',
    howItWorks: 'High volume confirms genuine breakout, not a fake-out. Institutions are buying.',
    example: 'Stock at $200 resistance for months. Breaks to $202 with 10M volume vs 3M average.',
    probability: '79% win rate',
    tradingStyle: 'Swing trading',
    whenToUse: 'When breaking key resistance levels with strong volume confirmation.',
  },
  {
    name: 'Triple Confirmation Bounce 🎯',
    signal: 'bullish',
    description: 'Complete swing trade strategy combining trend, support, and momentum analysis.',
    howItWorks:
      'Requires ALL three confirmations: (1) Uptrend intact (50MA > 200MA), (2) Pullback to support, (3) Bullish momentum (RSI rising from <40, MACD turning up).',
    example:
      'Stock in uptrend pulls back to 50-day MA at $180. RSI drops to 35 but starts rising. MACD histogram turns positive. Volume above average on bounce.',
    probability: '76% win rate (80%+ with volume)',
    tradingStyle: 'Swing trading (5-15 days)',
    whenToUse:
      'Perfect for catching low-risk bounces in strong uptrending stocks during healthy pullbacks.',
  },
];

interface PatternDefinitionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PatternDefinitions: React.FC<PatternDefinitionsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return 'text-green-600 bg-green-100';
      case 'bearish':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Pattern Definitions</h2>
            <p className="text-muted-foreground mt-1">
              Understanding chart patterns and trading signals
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-6">
            {PATTERN_DEFINITIONS.map((pattern, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getSignalIcon(pattern.signal)}
                      {pattern.name}
                    </CardTitle>
                    <Badge className={getSignalColor(pattern.signal)}>
                      {getSignalIcon(pattern.signal)}
                      <span className="ml-1 capitalize">{pattern.signal}</span>
                    </Badge>
                  </div>
                  <CardDescription>{pattern.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">How It Works</h4>
                    <p className="text-sm text-muted-foreground">{pattern.howItWorks}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Example</h4>
                    <p className="text-sm text-muted-foreground italic">{pattern.example}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium text-muted-foreground mb-1">Success Rate</div>
                      <div className="font-bold">{pattern.probability}</div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium text-muted-foreground mb-1">Trading Style</div>
                      <div className="font-bold">{pattern.tradingStyle}</div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="font-medium text-muted-foreground mb-1">Best Used</div>
                      <div className="font-bold text-xs">{pattern.whenToUse}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Our Pattern Detection Algorithm</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Step 1:</strong> Analyzes candlestick relationships (open, high, low, close)
              </p>
              <p>
                <strong>Step 2:</strong> Identifies support/resistance levels using local
                peaks/valleys
              </p>
              <p>
                <strong>Step 3:</strong> Calculates moving average crossovers (50-day vs 200-day)
              </p>
              <p>
                <strong>Step 4:</strong> Confirms patterns with volume analysis (1.5x+ average =
                strong signal)
              </p>
              <p>
                <strong>Step 5:</strong> Combines multiple factors for "confluence" patterns (higher
                accuracy)
              </p>
              <p>
                <strong>Step 6:</strong> Executes complete swing strategies (Triple Confirmation
                Bounce)
              </p>
              <p>
                <strong>Step 7:</strong> Assigns probability scores based on historical backtesting
                data
              </p>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                🎯 Triple Confirmation Bounce Strategy
              </h4>
              <div className="text-xs text-green-800 space-y-1">
                <p>
                  <strong>✅ Uptrend Check:</strong> 50MA &gt; 200MA AND Price &gt; 200MA
                </p>
                <p>
                  <strong>✅ Support Test:</strong> Price near 50MA or horizontal support
                </p>
                <p>
                  <strong>✅ Momentum:</strong> RSI &lt; 40 but rising + MACD turning bullish
                </p>
                <p>
                  <strong>✅ Volume:</strong> Above 20-day average (optional but boosts win rate)
                </p>
                <p>
                  <strong>🎯 Targets:</strong> 5-10% gain or 2:1 risk/reward minimum
                </p>
                <p>
                  <strong>🛑 Stop:</strong> Just below support level used for entry
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternDefinitions;
