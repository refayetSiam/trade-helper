'use client';

import { useState, useEffect } from 'react';
import { polygonRateLimiter, RateLimitStatus } from '@/lib/services/polygon-rate-limiter';

export function usePolygonRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus>({
    remainingCalls: 5,
    timeUntilNext: 0,
    queueLength: 0,
    isRateLimited: false,
  });

  useEffect(() => {
    // Subscribe to rate limit status updates
    const unsubscribe = polygonRateLimiter.onStatusChange(setStatus);

    return unsubscribe;
  }, []);

  return {
    ...status,
    // Helper functions
    canMakeCall: () => status.remainingCalls > 0,
    getEstimatedWaitTime: (priority: 'high' | 'low' = 'high') =>
      polygonRateLimiter.getEstimatedWaitTime(priority),
    clearLowPriorityRequests: () => polygonRateLimiter.clearLowPriorityRequests(),
    getQueueInfo: () => polygonRateLimiter.getQueueInfo(),
  };
}
