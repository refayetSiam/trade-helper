'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  LineChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface PatternItem {
  id: string;
  name: string;
  description: string;
  winRate?: string;
  enabled: boolean;
  signal?: 'bullish' | 'bearish' | 'neutral';
}

interface PatternFolder {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  patterns: PatternItem[];
  expanded: boolean;
}

interface PatternDetectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  swingTradingMode: boolean;
  intradayMode: boolean;
  patternTypes: string[];
  onSwingTradingToggle: (enabled: boolean) => void;
  onIntradayToggle: (enabled: boolean) => void;
  onPatternTypeToggle: (type: string, enabled: boolean) => void;
  onIndividualPatternToggle?: (patternId: string, enabled: boolean) => void;
}

const PatternDetectionDrawer: React.FC<PatternDetectionDrawerProps> = ({
  isOpen,
  onClose,
  swingTradingMode,
  intradayMode,
  patternTypes,
  onSwingTradingToggle,
  onIntradayToggle,
  onPatternTypeToggle,
  onIndividualPatternToggle = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['recommended', 'candlestick', 'technical'])
  );

  // Initialize pattern data structure
  const [patternFolders, setPatternFolders] = useState<PatternFolder[]>([
    {
      id: 'recommended',
      name: 'Recommended Plays',
      icon: Target,
      description: 'High-probability strategies for different trading styles',
      expanded: true,
      patterns: [
        {
          id: 'swing-trading',
          name: '2-3 Day Swing Trading Mode',
          description:
            'Comprehensive swing trading signals with trend + volume + momentum + price action confirmation',
          enabled: swingTradingMode,
        },
        {
          id: 'intraday-gap',
          name: 'Intraday Gap-Up Breakout Mode',
          description: 'Intraday gap-up breakout opportunities with 72% historical win rate',
          enabled: intradayMode,
        },
      ],
    },
    {
      id: 'candlestick',
      name: 'Candlestick Patterns',
      icon: BarChart3,
      description: 'Single and multi-candle reversal patterns',
      expanded: true,
      patterns: [
        {
          id: 'bullish-engulfing',
          name: 'Bullish Engulfing',
          description: 'Green candle completely engulfs previous red candle',
          winRate: '68%',
          signal: 'bullish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'bearish-engulfing',
          name: 'Bearish Engulfing',
          description: 'Red candle completely engulfs previous green candle',
          winRate: '65%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'hammer',
          name: 'Hammer',
          description: 'Long lower shadow with small body, bullish reversal',
          winRate: '59%',
          signal: 'bullish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'shooting-star',
          name: 'Shooting Star',
          description: 'Long upper shadow with small body, bearish reversal',
          winRate: '57%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'doji',
          name: 'Doji',
          description: 'Open and close nearly equal, indecision pattern',
          signal: 'neutral',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'morning-star',
          name: 'Morning Star',
          description: '3-candle bullish reversal pattern',
          winRate: '70.1%',
          signal: 'bullish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'evening-star',
          name: 'Evening Star',
          description: '3-candle bearish reversal pattern',
          winRate: '69.4%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'inside-bar',
          name: 'Inside Bar',
          description: 'Range contraction with volume confirmation',
          winRate: '71.6%',
          signal: 'neutral',
          enabled: patternTypes.includes('candlestick'),
        },
        {
          id: 'marubozu',
          name: 'Marubozu',
          description: 'No-wick candle, strong trend continuation',
          enabled: patternTypes.includes('candlestick'),
        },
      ],
    },
    {
      id: 'technical',
      name: 'Technical Indicators',
      icon: TrendingUp,
      description: 'Momentum and trend-based signals',
      expanded: true,
      patterns: [
        {
          id: 'rsi-bull-div',
          name: 'RSI Bullish Divergence',
          description: 'Price lower low, RSI higher low',
          winRate: '72.5%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'rsi-bear-div',
          name: 'RSI Bearish Divergence',
          description: 'Price higher high, RSI lower high',
          winRate: '72.5%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'macd-bull-accel',
          name: 'MACD Bullish Acceleration',
          description: 'Histogram rising for 3+ candles',
          winRate: '68.4%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'macd-bear-accel',
          name: 'MACD Bearish Acceleration',
          description: 'Histogram falling for 3+ candles',
          winRate: '68.4%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'stoch-bull-cross',
          name: 'Stochastic Bullish Cross',
          description: '%K crosses %D upward in oversold',
          winRate: '65.9%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'stoch-bear-cross',
          name: 'Stochastic Bearish Cross',
          description: '%K crosses %D downward in overbought',
          winRate: '65.9%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'vwap-reclaim',
          name: 'VWAP Bullish Reclaim',
          description: 'Price crosses above VWAP and holds',
          winRate: '70.3%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'vwap-reject',
          name: 'VWAP Bearish Reject',
          description: 'Price fails to reclaim or rejects VWAP',
          winRate: '70.3%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
      ],
    },
    {
      id: 'advanced',
      name: 'Advanced Combinations',
      icon: Zap,
      description: 'Multi-factor high-probability setups',
      expanded: false,
      patterns: [
        {
          id: 'rsi-support',
          name: 'RSI Divergence + Support',
          description: 'RSI bullish divergence near support level',
          winRate: '78.2%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'inside-bar-volume',
          name: 'Inside Bar Volume Breakout',
          description: 'Inside bar with volume surge breakout',
          winRate: '74.5%',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'cup-handle',
          name: 'Cup & Handle',
          description: 'Classic cup and handle continuation pattern',
          winRate: '76.1%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'ema-pullback',
          name: 'EMA Pullback',
          description: 'EMA 20/50 pullback entry opportunity',
          winRate: '72.8%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'golden-cross',
          name: 'Golden Cross + Pullback',
          description: '50-day MA crosses above 200-day MA with pullback',
          winRate: '76%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'death-cross',
          name: 'Death Cross + Failed Rally',
          description: '50-day MA crosses below 200-day MA with failed rally',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'eod-sharp-drop',
          name: 'EOD Sharp Drop Analysis',
          description: 'End-of-day sharp drop bounce/continuation detector',
          winRate: '71.3%/73.7%',
          enabled: patternTypes.includes('combination'),
        },
      ],
    },
    {
      id: 'intraday',
      name: 'Intraday Strategies',
      icon: Activity,
      description: 'Same-day trading opportunities',
      expanded: false,
      patterns: [
        {
          id: 'orb',
          name: 'Opening Range Breakout',
          description: 'Range breakout with volume confirmation',
          winRate: '73.6%',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'vwap-bounce',
          name: 'VWAP Bounce',
          description: 'Mean reversion bounce off VWAP',
          winRate: '70.5%',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'liquidity-sweep',
          name: 'Liquidity Sweep',
          description: 'False breakout reversal opportunity',
          winRate: '68.9%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
      ],
    },
    {
      id: 'support-resistance',
      name: 'Support & Resistance',
      icon: LineChart,
      description: 'Key level analysis and confluence detection',
      expanded: false,
      patterns: [
        {
          id: 'confluence',
          name: 'Multi-Factor Confluence',
          description: 'Multiple pattern and level confirmations',
          enabled: patternTypes.includes('confluence'),
        },
        {
          id: 'breakout-volume',
          name: 'Breakout with Volume',
          description: 'Support/resistance breakout with volume confirmation',
          enabled: patternTypes.includes('confluence'),
        },
      ],
    },
  ]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);

    // Update folder state
    setPatternFolders(prev =>
      prev.map(folder =>
        folder.id === folderId ? { ...folder, expanded: newExpanded.has(folderId) } : folder
      )
    );
  };

  const toggleAllPatternsInFolder = (folderId: string, enabled: boolean) => {
    if (folderId === 'recommended') {
      // Handle special recommended patterns
      const folder = patternFolders.find(f => f.id === folderId);
      if (folder) {
        folder.patterns.forEach(pattern => {
          if (pattern.id === 'swing-trading') {
            onSwingTradingToggle(enabled);
          } else if (pattern.id === 'intraday-gap') {
            onIntradayToggle(enabled);
          }
        });
      }
    } else if (folderId === 'candlestick') {
      onPatternTypeToggle('candlestick', enabled);
    } else if (['technical', 'advanced', 'intraday'].includes(folderId)) {
      onPatternTypeToggle('combination', enabled);
    } else if (folderId === 'support-resistance') {
      onPatternTypeToggle('confluence', enabled);
    }

    // Update local state
    setPatternFolders(prev =>
      prev.map(folder =>
        folder.id === folderId
          ? {
              ...folder,
              patterns: folder.patterns.map(pattern => ({ ...pattern, enabled })),
            }
          : folder
      )
    );
  };

  const handleIndividualPatternToggle = (folderId: string, patternId: string, enabled: boolean) => {
    // Handle special cases
    if (patternId === 'swing-trading') {
      onSwingTradingToggle(enabled);
    } else if (patternId === 'intraday-gap') {
      onIntradayToggle(enabled);
    } else {
      // For other patterns, call the callback if provided
      onIndividualPatternToggle(patternId, enabled);
    }

    // Update local state
    setPatternFolders(prev =>
      prev.map(folder =>
        folder.id === folderId
          ? {
              ...folder,
              patterns: folder.patterns.map(pattern =>
                pattern.id === patternId ? { ...pattern, enabled } : pattern
              ),
            }
          : folder
      )
    );
  };

  // Filter patterns based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return patternFolders;

    return patternFolders
      .map(folder => ({
        ...folder,
        patterns: folder.patterns.filter(
          pattern =>
            pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pattern.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(folder => folder.patterns.length > 0);
  }, [patternFolders, searchQuery]);

  // Calculate stats
  const totalPatterns = patternFolders.reduce((sum, folder) => sum + folder.patterns.length, 0);
  const enabledPatterns = patternFolders.reduce(
    (sum, folder) => sum + folder.patterns.filter(p => p.enabled).length,
    0
  );

  const getSignalColor = (signal?: string) => {
    switch (signal) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getSignalIcon = (signal?: string) => {
    switch (signal) {
      case 'bullish':
        return '↗️';
      case 'bearish':
        return '↘️';
      case 'neutral':
        return '➡️';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Pattern Detection
            </h2>
            <p className="text-sm text-muted-foreground">
              {enabledPatterns}/{totalPatterns} algorithms active
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patterns and algorithms..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {filteredFolders.map(folder => {
              const FolderIcon = folder.icon;
              const isExpanded = expandedFolders.has(folder.id);
              const enabledCount = folder.patterns.filter(p => p.enabled).length;
              const totalCount = folder.patterns.length;
              const allEnabled = enabledCount === totalCount && totalCount > 0;
              const someEnabled = enabledCount > 0 && enabledCount < totalCount;

              return (
                <div key={folder.id} className="border rounded-lg">
                  {/* Folder Header */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <FolderIcon className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{folder.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {enabledCount}/{totalCount}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{folder.description}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allEnabled}
                          indeterminate={someEnabled}
                          onCheckedChange={checked =>
                            toggleAllPatternsInFolder(folder.id, checked as boolean)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Folder Content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      <div className="p-3 space-y-3">
                        {folder.patterns.map(pattern => (
                          <div
                            key={pattern.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={pattern.enabled}
                              onCheckedChange={checked =>
                                handleIndividualPatternToggle(
                                  folder.id,
                                  pattern.id,
                                  checked as boolean
                                )
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{pattern.name}</span>
                                {pattern.signal && (
                                  <span className={`text-xs ${getSignalColor(pattern.signal)}`}>
                                    {getSignalIcon(pattern.signal)}
                                  </span>
                                )}
                                {pattern.winRate && (
                                  <Badge variant="outline" className="text-xs">
                                    {pattern.winRate}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-tight">
                                {pattern.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default PatternDetectionDrawer;
