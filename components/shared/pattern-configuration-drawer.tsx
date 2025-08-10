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
import { PATTERN_DEFINITIONS, PatternDefinition } from '@/lib/data/pattern-definitions';

interface PatternItem {
  id: string;
  name: string;
  description: string;
  winRate?: string;
  enabled: boolean;
  signal?: 'bullish' | 'bearish' | 'neutral';
  definitionKey?: string; // Links to PATTERN_DEFINITIONS
}

interface PatternFolder {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  patterns: PatternItem[];
  expanded: boolean;
}

interface PatternConfigurationDrawerProps {
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

const PatternConfigurationDrawer: React.FC<PatternConfigurationDrawerProps> = ({
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
    new Set(['recommended', 'candlestick'])
  );
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Handle drawer close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  // Initialize pattern data structure with definition keys
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
          definitionKey: 'Bullish Engulfing',
        },
        {
          id: 'bearish-engulfing',
          name: 'Bearish Engulfing',
          description: 'Red candle completely engulfs previous green candle',
          winRate: '65%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Bearish Engulfing',
        },
        {
          id: 'hammer',
          name: 'Hammer',
          description: 'Long lower shadow with small body, bullish reversal',
          winRate: '59%',
          signal: 'bullish',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Hammer',
        },
        {
          id: 'shooting-star',
          name: 'Shooting Star',
          description: 'Long upper shadow with small body, bearish reversal',
          winRate: '57%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Shooting Star',
        },
        {
          id: 'doji',
          name: 'Doji',
          description: 'Open and close nearly equal, indecision pattern',
          signal: 'neutral',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Doji',
        },
        {
          id: 'morning-star',
          name: 'Morning Star',
          description: '3-candle bullish reversal pattern',
          winRate: '70.1%',
          signal: 'bullish',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Morning Star',
        },
        {
          id: 'evening-star',
          name: 'Evening Star',
          description: '3-candle bearish reversal pattern',
          winRate: '69.4%',
          signal: 'bearish',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Evening Star',
        },
        {
          id: 'inside-bar',
          name: 'Inside Bar',
          description: 'Range contraction with volume confirmation',
          winRate: '71.6%',
          signal: 'neutral',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Inside Bar',
        },
        {
          id: 'marubozu',
          name: 'Marubozu',
          description: 'No-wick candle, strong trend continuation',
          enabled: patternTypes.includes('candlestick'),
          definitionKey: 'Marubozu',
        },
      ],
    },
    {
      id: 'technical',
      name: 'Technical Indicators',
      icon: TrendingUp,
      description: 'Momentum and trend-based signals',
      expanded: false,
      patterns: [
        {
          id: 'rsi-bull-div',
          name: 'RSI Bullish Divergence',
          description: 'Price lower low, RSI higher low',
          winRate: '72.5%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'RSI Divergence',
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
          id: 'macd-bull-cross',
          name: 'MACD Bullish Cross',
          description: 'MACD line crosses above signal line',
          winRate: '68.4%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'MACD Bullish Cross',
        },
        {
          id: 'macd-bear-cross',
          name: 'MACD Bearish Cross',
          description: 'MACD line crosses below signal line',
          winRate: '68.4%',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
        },
        {
          id: 'golden-cross',
          name: 'Golden Cross',
          description: '50-day MA crosses above 200-day MA',
          winRate: '76%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Golden Cross',
        },
        {
          id: 'death-cross',
          name: 'Death Cross',
          description: '50-day MA crosses below 200-day MA',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Death Cross',
        },
      ],
    },
    {
      id: 'advanced',
      name: 'Advanced Patterns',
      icon: Zap,
      description: 'Complex multi-factor setups',
      expanded: false,
      patterns: [
        {
          id: 'cup-handle',
          name: 'Cup & Handle',
          description: 'Classic continuation pattern',
          winRate: '76.1%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Cup and Handle',
        },
        {
          id: 'triple-top',
          name: 'Triple Top',
          description: 'Three failed attempts at resistance',
          signal: 'bearish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Triple Top',
        },
        {
          id: 'ascending-triangle',
          name: 'Ascending Triangle',
          description: 'Rising support with horizontal resistance',
          winRate: '70%',
          signal: 'bullish',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Ascending Triangle',
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
          id: 'gap-up',
          name: 'Gap Up Breakout',
          description: 'Stock opens significantly higher than previous close',
          winRate: '60-80%',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Gap Up',
        },
        {
          id: 'volume-breakout',
          name: 'Volume Breakout',
          description: 'Price breaks key level with high volume',
          enabled: patternTypes.includes('combination'),
          definitionKey: 'Volume Breakout',
        },
      ],
    },
    {
      id: 'support-resistance',
      name: 'Support & Resistance',
      icon: LineChart,
      description: 'Key level analysis',
      expanded: false,
      patterns: [
        {
          id: 'support-bounce',
          name: 'Support Bounce',
          description: 'Price bounces off established support',
          signal: 'bullish',
          enabled: patternTypes.includes('confluence'),
          definitionKey: 'Support Bounce',
        },
        {
          id: 'resistance-rejection',
          name: 'Resistance Rejection',
          description: 'Price fails to break resistance',
          signal: 'bearish',
          enabled: patternTypes.includes('confluence'),
          definitionKey: 'Resistance Rejection',
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

    setPatternFolders(prev =>
      prev.map(folder =>
        folder.id === folderId ? { ...folder, expanded: newExpanded.has(folderId) } : folder
      )
    );
  };

  const toggleAllPatternsInFolder = (folderId: string, enabled: boolean) => {
    if (folderId === 'recommended') {
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
    if (patternId === 'swing-trading') {
      onSwingTradingToggle(enabled);
    } else if (patternId === 'intraday-gap') {
      onIntradayToggle(enabled);
    } else {
      onIndividualPatternToggle(patternId, enabled);
    }

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

  const handleEnableAll = useCallback(() => {
    // Enable all pattern types
    onPatternTypeToggle('candlestick', true);
    onPatternTypeToggle('combination', true);
    onPatternTypeToggle('confluence', true);
    onSwingTradingToggle(true);
    onIntradayToggle(true);

    // Update local state
    setPatternFolders(prev =>
      prev.map(folder => ({
        ...folder,
        patterns: folder.patterns.map(pattern => ({ ...pattern, enabled: true })),
      }))
    );
  }, [onPatternTypeToggle, onSwingTradingToggle, onIntradayToggle]);

  const handleDisableAll = useCallback(() => {
    // Disable all pattern types
    onPatternTypeToggle('candlestick', false);
    onPatternTypeToggle('combination', false);
    onPatternTypeToggle('confluence', false);
    onSwingTradingToggle(false);
    onIntradayToggle(false);

    // Update local state
    setPatternFolders(prev =>
      prev.map(folder => ({
        ...folder,
        patterns: folder.patterns.map(pattern => ({ ...pattern, enabled: false })),
      }))
    );
  }, [onPatternTypeToggle, onSwingTradingToggle, onIntradayToggle]);

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

  // Get pattern definition for selected pattern
  const selectedPatternDefinition = useMemo(() => {
    if (!selectedPattern) return null;

    const pattern = patternFolders
      .flatMap(folder => folder.patterns)
      .find(p => p.id === selectedPattern);

    if (!pattern?.definitionKey) return null;

    return PATTERN_DEFINITIONS.find(def => def.name === pattern.definitionKey);
  }, [selectedPattern, patternFolders]);

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
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-6xl bg-background border-l shadow-xl z-50 overflow-hidden flex flex-col transition-transform duration-300 ease-in-out ${
          isClosing ? 'animate-out slide-out-to-right' : 'animate-in slide-in-from-right'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Pattern Configuration
            </h2>
            <p className="text-sm text-muted-foreground">
              {enabledPatterns}/{totalPatterns} algorithms active
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Pattern Tree */}
          <div className="w-2/5 border-r flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patterns..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              {/* Global All/None buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAll}
                  className="flex-1 h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableAll}
                  className="flex-1 h-8 text-xs"
                >
                  None
                </Button>
              </div>
            </div>

            {/* Pattern Tree */}
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
                            </div>
                          </button>

                          <Checkbox
                            checked={allEnabled}
                            onCheckedChange={checked =>
                              toggleAllPatternsInFolder(folder.id, checked as boolean)
                            }
                          />
                        </div>
                      </div>

                      {/* Folder Content */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          <div className="p-3 space-y-2">
                            {folder.patterns.map(pattern => (
                              <div
                                key={pattern.id}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                  selectedPattern === pattern.id
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => setSelectedPattern(pattern.id)}
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
                                  onClick={e => e.stopPropagation()}
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

          {/* Right Panel - Pattern Details */}
          <div className="w-3/5 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {selectedPatternDefinition ? (
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Pattern Header */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">{selectedPatternDefinition.name}</h3>
                        <Badge
                          variant={
                            selectedPatternDefinition.signal === 'bullish'
                              ? 'default'
                              : selectedPatternDefinition.signal === 'bearish'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="capitalize"
                        >
                          {selectedPatternDefinition.signal}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-lg">
                        {selectedPatternDefinition.description}
                      </p>
                    </div>

                    {/* How It Works */}
                    <div>
                      <h4 className="text-lg font-semibold mb-2">How It Works</h4>
                      <p className="text-muted-foreground">
                        {selectedPatternDefinition.howItWorks}
                      </p>
                    </div>

                    {/* Example */}
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Example</h4>
                      <p className="text-muted-foreground">{selectedPatternDefinition.example}</p>
                    </div>

                    {/* Success Rate */}
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Success Rate</h4>
                      <p className="text-muted-foreground">
                        {selectedPatternDefinition.probability}
                      </p>
                    </div>

                    {/* Trading Style */}
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Trading Style</h4>
                      <p className="text-muted-foreground">
                        {selectedPatternDefinition.tradingStyle}
                      </p>
                    </div>

                    {/* Best Used */}
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Best Used</h4>
                      <p className="text-muted-foreground">{selectedPatternDefinition.whenToUse}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                      Select a Pattern
                    </h3>
                    <p className="text-muted-foreground">
                      Click on any pattern from the list to view detailed information, examples, and
                      trading guidance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatternConfigurationDrawer;
