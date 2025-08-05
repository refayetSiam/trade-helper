'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OptionData {
  contractSymbol: string;
  expiry: string;
  strike: number;
  optionPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  costOfBorrowing: number;
  netProfit: number;
  annualizedReturn: number;
  breakeven: number;
  daysToExpiry: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
  rho?: number;
  maxProfit?: number;
  maxLoss?: number;
  probabilityOfProfit?: number;
}

export interface SortConfig {
  key: keyof OptionData | null;
  direction: 'asc' | 'desc';
}

export interface OptionsTableProps {
  data: OptionData[];
  currency: 'USD' | 'CAD';
  loading?: boolean;
  onSort?: (config: SortConfig) => void;
  className?: string;
  showGreeks?: boolean;
  showAdvancedMetrics?: boolean;
}

const OptionsTable: React.FC<OptionsTableProps> = ({
  data,
  currency,
  loading = false,
  onSort,
  className,
  showGreeks = false,
  showAdvancedMetrics = false,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  const formatCurrency = (amount: number): string => {
    const symbol = currency === 'CAD' ? 'C$' : '$';
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getValueClass = (value: number): string => {
    if (value > 0) return 'text-green-600 font-semibold';
    if (value < 0) return 'text-red-600 font-semibold';
    return 'text-yellow-600 font-semibold';
  };

  const handleSort = (key: keyof OptionData) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);

    if (onSort) {
      onSort(newSortConfig);
    }
  };

  const getSortIcon = (key: keyof OptionData) => {
    if (sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  const getSortClass = (key: keyof OptionData): string => {
    const baseClass =
      'sortable-header cursor-pointer select-none transition-all duration-200 hover:bg-muted/50';
    return sortConfig.key === key ? `${baseClass} bg-primary/10` : baseClass;
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      // Handle dates
      if (sortConfig.key === 'expiry') {
        const aDate = new Date(aVal as string).getTime();
        const bDate = new Date(bVal as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div
        className={cn(
          'bg-card rounded-xl shadow-lg border border-border overflow-hidden',
          className
        )}
      >
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading options data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'bg-card rounded-xl shadow-lg border border-border overflow-hidden',
          className
        )}
      >
        <div className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            <svg
              className="h-16 w-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">No Options Data</h3>
          <p className="text-muted-foreground">No options contracts match your current criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('bg-card rounded-xl shadow-lg border border-border overflow-hidden', className)}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('expiry')}`}
                onClick={() => handleSort('expiry')}
              >
                <div className="flex items-center space-x-1">
                  <span>Expiry</span>
                  {getSortIcon('expiry')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('strike')}`}
                onClick={() => handleSort('strike')}
              >
                <div className="flex items-center space-x-1">
                  <span>Strike</span>
                  {getSortIcon('strike')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('optionPrice')}`}
                onClick={() => handleSort('optionPrice')}
              >
                <div className="flex items-center space-x-1">
                  <span>Option Price</span>
                  {getSortIcon('optionPrice')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('volume')}`}
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center space-x-1">
                  <span>Volume</span>
                  {getSortIcon('volume')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('openInterest')}`}
                onClick={() => handleSort('openInterest')}
              >
                <div className="flex items-center space-x-1">
                  <span>Open Interest</span>
                  {getSortIcon('openInterest')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('impliedVolatility')}`}
                onClick={() => handleSort('impliedVolatility')}
              >
                <div className="flex items-center space-x-1">
                  <span>IV</span>
                  {getSortIcon('impliedVolatility')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('costOfBorrowing')}`}
                onClick={() => handleSort('costOfBorrowing')}
              >
                <div className="flex items-center space-x-1">
                  <span>Cost of Borrowing</span>
                  {getSortIcon('costOfBorrowing')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('netProfit')}`}
                onClick={() => handleSort('netProfit')}
              >
                <div className="flex items-center space-x-1">
                  <span>Net Profit</span>
                  {getSortIcon('netProfit')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('annualizedReturn')}`}
                onClick={() => handleSort('annualizedReturn')}
              >
                <div className="flex items-center space-x-1">
                  <span>Annual Return</span>
                  {getSortIcon('annualizedReturn')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('breakeven')}`}
                onClick={() => handleSort('breakeven')}
              >
                <div className="flex items-center space-x-1">
                  <span>Breakeven</span>
                  {getSortIcon('breakeven')}
                </div>
              </th>
              <th
                className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('daysToExpiry')}`}
                onClick={() => handleSort('daysToExpiry')}
              >
                <div className="flex items-center space-x-1">
                  <span>Days</span>
                  {getSortIcon('daysToExpiry')}
                </div>
              </th>

              {/* Greeks columns */}
              {showGreeks && (
                <>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('delta')}`}
                    onClick={() => handleSort('delta')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Delta</span>
                      {getSortIcon('delta')}
                    </div>
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('theta')}`}
                    onClick={() => handleSort('theta')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Theta</span>
                      {getSortIcon('theta')}
                    </div>
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('gamma')}`}
                    onClick={() => handleSort('gamma')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Gamma</span>
                      {getSortIcon('gamma')}
                    </div>
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('vega')}`}
                    onClick={() => handleSort('vega')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vega</span>
                      {getSortIcon('vega')}
                    </div>
                  </th>
                </>
              )}

              {/* Advanced metrics columns */}
              {showAdvancedMetrics && (
                <>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('maxProfit')}`}
                    onClick={() => handleSort('maxProfit')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Max Profit</span>
                      {getSortIcon('maxProfit')}
                    </div>
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold text-foreground text-sm ${getSortClass('probabilityOfProfit')}`}
                    onClick={() => handleSort('probabilityOfProfit')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Prob. Profit</span>
                      {getSortIcon('probabilityOfProfit')}
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((option, index) => (
              <tr
                key={option.contractSymbol || index}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4 text-sm">
                  <div className="font-semibold text-foreground">{option.expiry}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-foreground text-sm">
                  {formatCurrency(option.strike)}
                </td>
                <td className="py-3 px-4 font-semibold text-green-600 text-sm">
                  {formatCurrency(option.optionPrice)}
                </td>
                <td className="py-3 px-4 text-foreground text-sm">
                  {option.volume?.toLocaleString() || '0'}
                </td>
                <td className="py-3 px-4 text-foreground text-sm">
                  {option.openInterest?.toLocaleString() || '0'}
                </td>
                <td className="py-3 px-4 text-foreground text-sm">
                  {isFinite(option.impliedVolatility) && option.impliedVolatility < 10
                    ? `${(option.impliedVolatility * 100).toFixed(1)}%`
                    : '—'}
                </td>
                <td className="py-3 px-4 text-red-600 font-semibold text-sm">
                  {formatCurrency(option.costOfBorrowing)}
                </td>
                <td className={`py-3 px-4 text-sm ${getValueClass(option.netProfit)}`}>
                  {formatCurrency(option.netProfit)}
                </td>
                <td
                  className={`py-3 px-4 font-bold text-sm ${option.annualizedReturn > 450 ? 'text-orange-600' : getValueClass(option.annualizedReturn)}`}
                >
                  {option.annualizedReturn > 450
                    ? '>450%'
                    : `${(option.annualizedReturn || 0).toFixed(2)}%`}
                </td>
                <td className="py-3 px-4 font-semibold text-blue-600 text-sm">
                  {formatCurrency(option.breakeven)}
                </td>
                <td className="py-3 px-4 text-foreground text-sm">{option.daysToExpiry}</td>

                {/* Greeks data */}
                {showGreeks && (
                  <>
                    <td className="py-3 px-4 text-foreground text-sm font-mono">
                      {option.delta?.toFixed(4) || '—'}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm font-mono">
                      {option.theta?.toFixed(4) || '—'}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm font-mono">
                      {option.gamma?.toFixed(4) || '—'}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm font-mono">
                      {option.vega?.toFixed(4) || '—'}
                    </td>
                  </>
                )}

                {/* Advanced metrics data */}
                {showAdvancedMetrics && (
                  <>
                    <td className={`py-3 px-4 text-sm ${getValueClass(option.maxProfit || 0)}`}>
                      {option.maxProfit ? formatCurrency(option.maxProfit) : '—'}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {option.probabilityOfProfit
                        ? `${option.probabilityOfProfit.toFixed(1)}%`
                        : '—'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsTable;
