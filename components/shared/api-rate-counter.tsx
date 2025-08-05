'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { polygonRateLimiter, RateLimitStatus } from '@/lib/services/polygon-rate-limiter';
import { dataProvider } from '@/lib/services/data-provider';
import { cn } from '@/lib/utils';

interface ApiRateCounterProps {
  className?: string;
  showDetails?: boolean;
}

const ApiRateCounter: React.FC<ApiRateCounterProps> = ({ className, showDetails = false }) => {
  const [status, setStatus] = useState<RateLimitStatus>({
    remainingCalls: 5,
    timeUntilNext: 0,
    queueLength: 0,
    isRateLimited: false,
  });

  const [apiStatus, setApiStatus] = useState({
    remaining: 100,
    max: 200,
    percentage: 100,
  });

  useEffect(() => {
    // Subscribe to rate limit status updates
    const unsubscribe = polygonRateLimiter.onStatusChange(setStatus);

    // Update API status from data provider
    const updateApiStatus = () => {
      const status = dataProvider.getApiStatus();
      setApiStatus({
        remaining: status.combined.remaining,
        max: status.combined.max,
        percentage: status.combined.percentage,
      });
    };

    // Update immediately and then every 30 seconds
    updateApiStatus();
    const interval = setInterval(updateApiStatus, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (apiStatus.percentage >= 70) return 'text-green-600';
    if (apiStatus.percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (apiStatus.percentage >= 70) return 'bg-green-500';
    if (apiStatus.percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (status.isRateLimited || apiStatus.percentage < 10) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (status.queueLength > 0) {
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />;
    }
    if (apiStatus.percentage >= 70) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Activity className="h-4 w-4 text-yellow-600" />;
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusMessage = (): string => {
    if (status.isRateLimited && status.timeUntilNext > 0) {
      return `Rate limited - Next in ${formatTime(status.timeUntilNext)}`;
    }
    if (status.queueLength > 0) {
      return `${status.queueLength} request${status.queueLength > 1 ? 's' : ''} queued`;
    }
    if (apiStatus.percentage >= 90) {
      return 'All API calls available';
    }
    if (apiStatus.percentage >= 30) {
      return `${apiStatus.remaining}/${apiStatus.max} calls left`;
    }
    return 'API calls running low';
  };

  const progressPercentage = apiStatus.percentage;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 bg-card border rounded-lg shadow-sm',
        className
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">{getStatusIcon()}</div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Fallback API</span>
          <span className={cn('text-xs font-semibold', getStatusColor())}>
            {apiStatus.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
          <div
            className={cn('h-full transition-all duration-300', getProgressColor())}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status Message */}
        {showDetails && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">{getStatusMessage()}</span>
          </div>
        )}
      </div>

      {/* Time Until Next (when rate limited) */}
      {status.isRateLimited && status.timeUntilNext > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-mono">{formatTime(status.timeUntilNext)}</span>
        </div>
      )}
    </div>
  );
};

export default ApiRateCounter;
