'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Pin, PinOff, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingIndicatorPanelProps {
  isOpen: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  data: any;
  selectedIndicators: string[];
  onClose: () => void;
  onPin: () => void;
  onMove: (position: { x: number; y: number }) => void;
}

const FloatingIndicatorPanel: React.FC<FloatingIndicatorPanelProps> = ({
  isOpen,
  isPinned,
  position,
  data,
  selectedIndicators,
  onClose,
  onPin,
  onMove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!isOpen || !data) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPinned) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPinned) return;

    onMove({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-xl max-w-sm min-w-80">
        <CardHeader className="pb-2 cursor-move" onMouseDown={handleMouseDown}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              {data.dateStr}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPin}
                className="h-6 w-6 p-0 hover:bg-muted/80 transition-all duration-300"
                title={isPinned ? 'Unpin panel' : 'Pin panel'}
              >
                {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 hover:bg-muted/80 transition-all duration-300"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive transition-all duration-300"
                title="Close"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Always visible: Price data */}
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono font-bold text-foreground">${data.close?.toFixed(1)}</span>
            </div>
          </div>

          {/* Expandable content */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div
              className={`space-y-2 text-sm transition-all duration-300 delay-100 ${
                isExpanded
                  ? 'opacity-100 transform translate-y-0'
                  : 'opacity-0 transform -translate-y-2'
              }`}
            >
              {/* OHLC Data */}
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Price Data
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">Open:</span>
                    <span className="font-mono">${data.open?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">High:</span>
                    <span className="font-mono text-green-600">${data.high?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">Low:</span>
                    <span className="font-mono text-red-600">${data.low?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-mono">{data.volumeM?.toFixed(2)}M</span>
                  </div>
                </div>
              </div>

              {/* Indicators */}
              {selectedIndicators.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Technical Indicators
                  </h5>
                  <div className="space-y-2">
                    {selectedIndicators.includes('rsi') && data.rsi && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border-l-2 border-purple-500">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                          <span className="text-muted-foreground text-xs">RSI (14):</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-semibold text-xs ${
                              data.rsi > 70
                                ? 'text-red-500'
                                : data.rsi < 30
                                  ? 'text-green-500'
                                  : 'text-foreground'
                            }`}
                          >
                            {data.rsi.toFixed(2)}
                          </span>
                          <Badge
                            variant={
                              data.rsi > 70
                                ? 'destructive'
                                : data.rsi < 30
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Normal'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {selectedIndicators.includes('macd') && data.macd && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border-l-2 border-blue-500">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          <span className="text-muted-foreground text-xs">MACD:</span>
                        </div>
                        <span className="font-mono font-semibold text-xs">
                          {data.macd.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {selectedIndicators.includes('sma20') && data.sma20 && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border-l-2 border-amber-500">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span className="text-muted-foreground text-xs">SMA 20:</span>
                        </div>
                        <span className="font-mono font-semibold text-xs">
                          ${data.sma20.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {selectedIndicators.includes('sma50') && data.sma50 && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-red-50/50 dark:bg-red-900/20 border-l-2 border-red-500">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          <span className="text-muted-foreground text-xs">SMA 50:</span>
                        </div>
                        <span className="font-mono font-semibold text-xs">
                          ${data.sma50.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {selectedIndicators.includes('bollinger') && data.bbUpper && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-violet-50/50 dark:bg-violet-900/20 border-l-2 border-violet-500">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                            <span className="text-muted-foreground text-xs">BB Upper:</span>
                          </div>
                          <span className="font-mono font-semibold text-xs">
                            ${data.bbUpper.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-violet-50/50 dark:bg-violet-900/20 border-l-2 border-violet-500">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                            <span className="text-muted-foreground text-xs">BB Lower:</span>
                          </div>
                          <span className="font-mono font-semibold text-xs">
                            ${data.bbLower.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloatingIndicatorPanel;
