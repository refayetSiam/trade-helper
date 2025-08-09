'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react';

interface IndicatorInfoCardProps {
  indicatorId: string;
  name: string;
  description: string;
  value: number | string;
  previousValue?: number | string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume';
  interpretation?: string;
  signal?: 'bullish' | 'bearish' | 'neutral';
  isSelected: boolean;
  onToggle: (checked: boolean) => void;
}

const IndicatorInfoCard: React.FC<IndicatorInfoCardProps> = ({
  indicatorId,
  name,
  description,
  value,
  previousValue,
  category,
  interpretation,
  signal = 'neutral',
  isSelected,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trend':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'momentum':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'volatility':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'volume':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSignalIcon = () => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getSignalColor = () => {
    switch (signal) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <Card
      className={`transition-all duration-300 cursor-pointer hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'}`}
      onClick={() => onToggle(!isSelected)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{name}</CardTitle>
            <Badge className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(category)}`}>
              {category}
            </Badge>
            {isSelected && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getSignalIcon()}
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="h-6 w-6 p-0 hover:bg-muted/80 transition-all duration-300"
            >
              <Info
                className={`h-3 w-3 transition-all duration-300 ${
                  isExpanded ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Current Value:</span>
          <span className={`font-mono font-bold text-sm ${getSignalColor()}`}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
        </div>

        {/* Expandable content */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className={`space-y-3 transition-all duration-300 delay-100 ${
              isExpanded
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform -translate-y-2'
            }`}
          >
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="text-xs font-semibold text-foreground mb-2">Description</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>

            {previousValue && (
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-xs text-muted-foreground">Previous:</span>
                <span className="font-mono text-xs">
                  {typeof previousValue === 'number' ? previousValue.toFixed(2) : previousValue}
                </span>
              </div>
            )}

            {interpretation && (
              <div
                className="p-3 bg-muted/30 rounded-lg border-l-4"
                style={{
                  borderLeftColor:
                    signal === 'bullish' ? '#10b981' : signal === 'bearish' ? '#ef4444' : '#f59e0b',
                }}
              >
                <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  {getSignalIcon()}
                  Current Signal
                </h4>
                <p className="text-xs text-muted-foreground">{interpretation}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Badge
                variant={
                  signal === 'bullish'
                    ? 'default'
                    : signal === 'bearish'
                      ? 'destructive'
                      : 'secondary'
                }
                className="text-xs"
              >
                {signal.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {category.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndicatorInfoCard;
