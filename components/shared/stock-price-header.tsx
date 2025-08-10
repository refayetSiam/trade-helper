'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockPriceHeaderProps {
  symbol: string;
  currentPrice: number;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StockPriceHeader: React.FC<StockPriceHeaderProps> = ({
  symbol,
  currentPrice,
  priceChange,
  priceChangePercent,
  className = '',
  size = 'md',
}) => {
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const sizeClasses = {
    sm: {
      symbol: 'text-lg font-bold',
      price: 'text-lg font-semibold',
      badge: 'text-xs px-2 py-1',
      icon: 'h-3 w-3',
    },
    md: {
      symbol: 'text-2xl font-bold',
      price: 'text-xl font-semibold',
      badge: 'text-sm px-3 py-1',
      icon: 'h-4 w-4',
    },
    lg: {
      symbol: 'text-3xl font-bold',
      price: 'text-2xl font-semibold',
      badge: 'text-base px-4 py-2',
      icon: 'h-5 w-5',
    },
  };

  return (
    <div className={`bg-card rounded-lg border p-4 ${className}`}>
      <div className="flex items-center gap-3 justify-start">
        {/* Ticker Symbol */}
        <div className={`${sizeClasses[size].symbol} text-foreground`}>{symbol.toUpperCase()}</div>

        {/* Current Price */}
        <div className={`${sizeClasses[size].price} text-foreground`}>
          {formatCurrency(currentPrice)}
        </div>

        {/* Price Change Text */}
        {priceChange !== null && priceChange !== undefined && (
          <div
            className={`${getChangeColor(priceChange)} ${sizeClasses[size].badge} font-semibold flex items-center gap-1`}
          >
            {priceChange > 0 ? (
              <TrendingUp className={sizeClasses[size].icon} />
            ) : priceChange < 0 ? (
              <TrendingDown className={sizeClasses[size].icon} />
            ) : null}
            <span>
              {formatChange(priceChange)}
              {priceChangePercent !== null && priceChangePercent !== undefined && (
                <span className="ml-1">({formatPercent(priceChangePercent)})</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPriceHeader;
