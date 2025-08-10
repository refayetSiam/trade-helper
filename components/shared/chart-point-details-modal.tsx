'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarDays, TrendingUp, TrendingDown, BarChart3, Volume2 } from 'lucide-react';
import { ChartDataPoint, TechnicalIndicators } from '@/lib/services/chart-data';
import { DetectedPattern } from '@/lib/services/pattern-detection';

interface ChartPointDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataPoint: ChartDataPoint | null;
  indicators: TechnicalIndicators;
  selectedIndicators: string[];
  patterns?: DetectedPattern[];
}

const ChartPointDetailsModal: React.FC<ChartPointDetailsModalProps> = ({
  isOpen,
  onClose,
  dataPoint,
  indicators,
  selectedIndicators,
  patterns = [],
}) => {
  if (!dataPoint) return null;

  const dataIndex = dataPoint.index || 0;
  const priceChange = dataPoint.close - dataPoint.open;
  const priceChangePercent = (priceChange / dataPoint.open) * 100;

  // Determine date format based on data frequency
  // For intraday data (like 5-day timeframe with hourly), show time
  const formatDateTime = (date: Date): string => {
    // Check if this appears to be intraday data by looking at the date
    const now = new Date();
    const diffDays = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // If the data is very recent (within 7 days), likely intraday
    if (diffDays <= 7) {
      return format(date, 'EEEE, MMMM dd, yyyy • h:mm a');
    } else {
      return format(date, 'EEEE, MMMM dd, yyyy');
    }
  };

  // Get indicator values for this data point
  const getIndicatorValue = (indicatorId: string): string => {
    const idx = dataIndex;
    switch (indicatorId) {
      case 'rsi':
        return indicators.rsi?.[idx]?.toFixed(2) || 'N/A';
      case 'sma20':
        return indicators.sma?.sma20?.[idx] ? `$${indicators.sma.sma20[idx].toFixed(2)}` : 'N/A';
      case 'sma50':
        return indicators.sma?.sma50?.[idx] ? `$${indicators.sma.sma50[idx].toFixed(2)}` : 'N/A';
      case 'sma200':
        return indicators.sma?.sma200?.[idx] ? `$${indicators.sma.sma200[idx].toFixed(2)}` : 'N/A';
      case 'ema12':
        return indicators.ema?.ema12?.[idx] ? `$${indicators.ema.ema12[idx].toFixed(2)}` : 'N/A';
      case 'ema26':
        return indicators.ema?.ema26?.[idx] ? `$${indicators.ema.ema26[idx].toFixed(2)}` : 'N/A';
      case 'macd':
        return indicators.macd?.macd?.[idx]?.toFixed(4) || 'N/A';
      case 'stochastic':
        return indicators.stochastic?.k?.[idx]?.toFixed(2) || 'N/A';
      case 'vwap':
        return indicators.vwap?.[idx] ? `$${indicators.vwap[idx].toFixed(2)}` : 'N/A';
      case 'bollinger':
        const upper = indicators.bollingerBands?.upper?.[idx]?.toFixed(2);
        const middle = indicators.bollingerBands?.middle?.[idx]?.toFixed(2);
        const lower = indicators.bollingerBands?.lower?.[idx]?.toFixed(2);
        return upper && middle && lower ? `${upper}/${middle}/${lower}` : 'N/A';
      case 'obv':
        return indicators.obv?.[idx] ? (indicators.obv[idx] / 1000000).toFixed(2) + 'M' : 'N/A';
      default:
        return 'N/A';
    }
  };

  const getIndicatorName = (indicatorId: string): string => {
    const names: Record<string, string> = {
      rsi: 'RSI',
      sma20: 'SMA 20',
      sma50: 'SMA 50',
      sma200: 'SMA 200',
      ema12: 'EMA 12',
      ema26: 'EMA 26',
      macd: 'MACD',
      stochastic: 'Stochastic %K',
      vwap: 'VWAP',
      bollinger: 'Bollinger Bands (U/M/L)',
      obv: 'On-Balance Volume',
    };
    return names[indicatorId] || indicatorId.toUpperCase();
  };

  // Find patterns active on this date
  const activePatterns = patterns.filter(
    pattern => dataIndex >= pattern.startIndex && dataIndex <= pattern.endIndex
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Chart Point Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date and Price Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{formatDateTime(dataPoint.date)}</span>
                <Badge
                  variant={priceChange >= 0 ? 'default' : 'destructive'}
                  className={priceChange >= 0 ? 'bg-green-100 text-green-800' : ''}
                >
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (
                  {priceChangePercent >= 0 ? '+' : ''}
                  {priceChangePercent.toFixed(2)}%)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Open:
                    </span>
                    <span className="font-mono font-semibold">${dataPoint.open.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      High:
                    </span>
                    <span className="font-mono font-semibold text-green-600">
                      ${dataPoint.high.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Low:
                    </span>
                    <span className="font-mono font-semibold text-red-600">
                      ${dataPoint.low.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Close:</span>
                    <span className="font-mono font-semibold">${dataPoint.close.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-muted-foreground">Volume:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {(dataPoint.volume / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Range:</span>
                    <span className="font-mono font-semibold">
                      ${(dataPoint.high - dataPoint.low).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          {selectedIndicators.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedIndicators.map(indicatorId => {
                    const value = getIndicatorValue(indicatorId);
                    const name = getIndicatorName(indicatorId);
                    return (
                      <div
                        key={indicatorId}
                        className="flex justify-between items-center p-2 bg-muted/30 rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground">{name}:</span>
                        <span className="font-mono font-semibold text-sm">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Patterns */}
          {activePatterns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activePatterns.map((pattern, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pattern.code || pattern.name.substring(0, 3).toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-sm">{pattern.name}</span>
                        </div>
                        <Badge
                          variant={
                            pattern.signal === 'bullish'
                              ? 'default'
                              : pattern.signal === 'bearish'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {pattern.signal.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-blue-500">Entry:</span>
                          <span className="font-mono">${pattern.entryPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-500">Target:</span>
                          <span className="font-mono">${pattern.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-500">Stop:</span>
                          <span className="font-mono">${pattern.stopLoss.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChartPointDetailsModal;
