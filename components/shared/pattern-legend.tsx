'use client';

import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PatternInfo {
  code: string;
  name: string;
  description: string;
  type: 'candlestick' | 'support_resistance' | 'targets_stops' | 'combinations';
  color: string;
}

const PATTERN_DEFINITIONS: PatternInfo[] = [
  // Candlestick Patterns
  {
    code: 'BE',
    name: 'Bullish Engulfing',
    description: 'Green candle completely engulfs previous red candle',
    type: 'candlestick',
    color: '#10b981',
  },
  {
    code: 'BR',
    name: 'Bearish Engulfing',
    description: 'Red candle completely engulfs previous green candle',
    type: 'candlestick',
    color: '#ef4444',
  },
  {
    code: 'H',
    name: 'Hammer',
    description: 'Long lower shadow with small body, bullish reversal',
    type: 'candlestick',
    color: '#10b981',
  },
  {
    code: 'SS',
    name: 'Shooting Star',
    description: 'Long upper shadow with small body, bearish reversal',
    type: 'candlestick',
    color: '#ef4444',
  },
  {
    code: 'D',
    name: 'Doji',
    description: 'Open and close nearly equal, indecision pattern',
    type: 'candlestick',
    color: '#f59e0b',
  },

  // Support & Resistance
  {
    code: 'S1',
    name: 'Primary Support',
    description: 'Strongest support level with 3+ touches',
    type: 'support_resistance',
    color: '#22d3ee',
  },
  {
    code: 'S2',
    name: 'Secondary Support',
    description: 'Second strongest support level',
    type: 'support_resistance',
    color: '#22d3ee',
  },
  {
    code: 'R1',
    name: 'Primary Resistance',
    description: 'Strongest resistance level with 3+ touches',
    type: 'support_resistance',
    color: '#f472b6',
  },
  {
    code: 'R2',
    name: 'Secondary Resistance',
    description: 'Second strongest resistance level',
    type: 'support_resistance',
    color: '#f472b6',
  },

  // Targets & Stops
  {
    code: 'T1',
    name: 'Target Price',
    description: 'Calculated profit target based on pattern',
    type: 'targets_stops',
    color: '#10b981',
  },
  {
    code: 'SL',
    name: 'Stop Loss',
    description: 'Risk management exit level',
    type: 'targets_stops',
    color: '#ef4444',
  },

  // Advanced Combinations
  {
    code: 'TCB',
    name: 'Triple Confirmation Bounce',
    description: 'Uptrend + Support + Momentum alignment',
    type: 'combinations',
    color: '#8b5cf6',
  },
  {
    code: 'GC',
    name: 'Golden Cross',
    description: 'Fast MA crosses above slow MA',
    type: 'combinations',
    color: '#f59e0b',
  },
  {
    code: 'DC',
    name: 'Death Cross',
    description: 'Fast MA crosses below slow MA',
    type: 'combinations',
    color: '#ef4444',
  },
  {
    code: 'BO',
    name: 'Breakout',
    description: 'Price breaks through key level with volume',
    type: 'combinations',
    color: '#10b981',
  },
];

interface PatternLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

const PatternLegend: React.FC<PatternLegendProps> = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('candlestick');

  if (!isOpen) return null;

  const groupedPatterns = PATTERN_DEFINITIONS.reduce(
    (acc, pattern) => {
      if (!acc[pattern.type]) {
        acc[pattern.type] = [];
      }
      acc[pattern.type].push(pattern);
      return acc;
    },
    {} as Record<string, PatternInfo[]>
  );

  const sectionTitles = {
    candlestick: 'Candlestick Patterns',
    support_resistance: 'Support & Resistance',
    targets_stops: 'Targets & Stop Loss',
    combinations: 'Advanced Combinations',
  };

  const sectionDescriptions = {
    candlestick: 'Single or multi-candle reversal patterns',
    support_resistance: 'Key price levels where price has historically bounced',
    targets_stops: 'Trade management levels for entries and exits',
    combinations: 'Multi-factor confirmations with higher probability',
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Pattern Code Reference
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Quick reference for pattern detection symbols on your charts
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {Object.entries(groupedPatterns).map(([sectionKey, patterns]) => (
            <div key={sectionKey} className="border rounded-lg">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-semibold">
                    {sectionTitles[sectionKey as keyof typeof sectionTitles]}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sectionDescriptions[sectionKey as keyof typeof sectionDescriptions]}
                  </p>
                </div>
                {expandedSection === sectionKey ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedSection === sectionKey && (
                <div className="border-t p-3 space-y-3">
                  {patterns.map(pattern => (
                    <div key={pattern.code} className="flex items-center gap-3">
                      {/* Pattern Code Badge */}
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: pattern.color }}
                      >
                        {pattern.code}
                      </div>

                      {/* Pattern Info */}
                      <div className="flex-1">
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-sm text-muted-foreground">{pattern.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Usage Notes */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How to Use</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>
                • <strong>High confidence patterns</strong> show a ⭐ and outer ring
              </li>
              <li>
                • <strong>Hover over patterns</strong> to see full details and probability
              </li>
              <li>
                • <strong>Click patterns</strong> to open detailed analysis panel
              </li>
              <li>
                • <strong>Dashed lines</strong> indicate support/resistance levels
              </li>
              <li>
                • <strong>Dotted lines</strong> show targets (T1) and stop losses (SL)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternLegend;
