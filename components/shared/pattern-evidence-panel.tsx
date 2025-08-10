'use client';

import React from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { DetectedPattern } from '@/lib/services/pattern-detection';
import { ChartDataPoint } from '@/lib/services/chart-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatternEvidencePanelProps {
  pattern: DetectedPattern | null;
  onClose: () => void;
  chartData?: ChartDataPoint[];
}

const PatternEvidencePanel: React.FC<PatternEvidencePanelProps> = ({
  pattern,
  onClose,
  chartData,
}) => {
  if (!pattern) return null;

  const getPatternActivationDate = () => {
    if (!chartData || !pattern) return null;
    const dataPoint = chartData[pattern.startIndex];
    if (!dataPoint?.date) return null;

    const date = new Date(dataPoint.date);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const activationDate = getPatternActivationDate();

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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-80 max-h-[90vh] overflow-y-auto z-50 shadow-xl border-2 animate-in fade-in slide-in-from-right-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSignalIcon(pattern.signal)}
            <CardTitle className="text-lg">{pattern.name}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 rounded-full p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{pattern.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signal and Confidence */}
        <div className="flex gap-2">
          <Badge className={getSignalColor(pattern.signal)}>
            {getSignalIcon(pattern.signal)}
            <span className="ml-1 capitalize">{pattern.signal}</span>
          </Badge>
          <Badge className={getConfidenceColor(pattern.confidence)}>
            <span className="capitalize">{pattern.confidence} Confidence</span>
          </Badge>
        </div>

        {/* Pattern Activation Date */}
        {activationDate && (
          <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Pattern activated:</span>
            <span className="font-semibold">{activationDate}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span>Probability</span>
            </div>
            <div className="font-bold text-lg">{pattern.probability.toFixed(1)}%</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>Win Rate</span>
            </div>
            <div className="font-bold text-lg">{pattern.winRate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Price Levels */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-1">
            <Target className="h-4 w-4" />
            Price Targets
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Entry:</span>
              <span className="font-mono font-semibold">${pattern.entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-green-600">Target:</span>
              <span className="font-mono font-semibold text-green-600">
                ${pattern.targetPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-red-600">Stop Loss:</span>
              <span className="font-mono font-semibold text-red-600">
                ${pattern.stopLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-t pt-2">
              <span className="text-muted-foreground">Risk/Reward:</span>
              <span className="font-semibold">1:{pattern.riskReward.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Evidence
          </h4>
          <div className="space-y-1">
            {pattern.evidence.map((evidence, index) => (
              <div key={index} className="flex items-start gap-2 text-sm bg-muted/30 rounded p-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{evidence}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Explanation */}
        {pattern.algorithm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-blue-800 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Algorithm Details</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">{pattern.algorithm}</p>
          </div>
        )}

        {/* Confirmation Checklist */}
        {pattern.confirmation && pattern.confirmation.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Confirmation Checklist
            </h4>
            <div className="space-y-1">
              {pattern.confirmation.map((confirmation, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm bg-muted/30 rounded p-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <span>{confirmation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern Type Info */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Pattern Details</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="capitalize">{pattern.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Trading Style:</span>
              <span className="capitalize">{pattern.tradingStyle}</span>
            </div>
            <div className="flex justify-between">
              <span>Timeframe:</span>
              <span>{pattern.timeframe}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Disclaimer:</strong> Pattern analysis is based on historical data and
              probabilities. Past performance does not guarantee future results. Always conduct your
              own research and consider risk management.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternEvidencePanel;
