'use client';

import React from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DataFreshnessInfo {
  isStale: boolean;
  daysBehind: number;
  lastDataDate: string;
  expectedDataDate: string;
  warningMessage?: string;
}

interface DataFreshnessIndicatorProps {
  freshness: DataFreshnessInfo;
  symbol: string;
  className?: string;
}

const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  freshness,
  symbol,
  className = '',
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = () => {
    if (!freshness.isStale) return 'text-green-400 border-green-400/30 bg-green-400/10';
    if (freshness.daysBehind <= 3) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    if (freshness.daysBehind <= 7) return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    return 'text-red-400 border-red-400/30 bg-red-400/10';
  };

  const getStatusIcon = () => {
    if (!freshness.isStale) return <CheckCircle size={16} className="text-green-400" />;
    if (freshness.daysBehind <= 3) return <Clock size={16} className="text-yellow-400" />;
    if (freshness.daysBehind <= 7) return <AlertTriangle size={16} className="text-orange-400" />;
    return <XCircle size={16} className="text-red-400" />;
  };

  const getStatusText = () => {
    if (!freshness.isStale) return 'Current';
    if (freshness.daysBehind <= 1) return 'Delayed';
    if (freshness.daysBehind <= 7) return 'Stale';
    return 'Very Stale';
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{symbol}</span>
          <span className="opacity-60">•</span>
          <span>{getStatusText()}</span>
        </div>
        <div className="text-xs opacity-75">
          Last updated: {formatDate(freshness.lastDataDate)}
          {freshness.daysBehind > 0 && (
            <span className="ml-1">
              ({freshness.daysBehind} day{freshness.daysBehind === 1 ? '' : 's'} ago)
            </span>
          )}
        </div>
        {freshness.warningMessage && (
          <div className="text-xs mt-1 opacity-90 font-medium">{freshness.warningMessage}</div>
        )}
      </div>
    </div>
  );
};

export default DataFreshnessIndicator;
