export interface QueuedRequest {
  id: string;
  priority: 'high' | 'low';
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export interface RateLimitStatus {
  remainingCalls: number;
  timeUntilNext: number;
  queueLength: number;
  isRateLimited: boolean;
}

class PolygonRateLimiter {
  private callTimestamps: number[] = [];
  private readonly maxCalls = 5;
  private readonly windowMs = 60000; // 1 minute
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private statusListeners: ((status: RateLimitStatus) => void)[] = [];

  constructor() {
    // Start queue processor
    this.processQueue();

    // Emit status updates every second
    setInterval(() => {
      this.emitStatusUpdate();
    }, 1000);
  }

  // Add a status change listener
  onStatusChange(callback: (status: RateLimitStatus) => void) {
    this.statusListeners.push(callback);
    // Immediately emit current status
    callback(this.getStatus());

    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  // Get current rate limit status
  getStatus(): RateLimitStatus {
    this.cleanOldTimestamps();
    const remainingCalls = Math.max(0, this.maxCalls - this.callTimestamps.length);

    return {
      remainingCalls,
      timeUntilNext: this.getTimeUntilNextCall(),
      queueLength: this.requestQueue.length,
      isRateLimited: remainingCalls === 0,
    };
  }

  // Get remaining calls
  getRemainingCalls(): number {
    this.cleanOldTimestamps();
    return Math.max(0, this.maxCalls - this.callTimestamps.length);
  }

  // Clean timestamps older than 1 minute
  private cleanOldTimestamps() {
    const cutoff = Date.now() - this.windowMs;
    this.callTimestamps = this.callTimestamps.filter(ts => ts > cutoff);
  }

  // Check if call is allowed
  canMakeCall(): boolean {
    this.cleanOldTimestamps();
    return this.callTimestamps.length < this.maxCalls;
  }

  // Record a call
  private recordCall() {
    this.callTimestamps.push(Date.now());
    this.emitStatusUpdate();
  }

  // Get time until next available call (in seconds)
  getTimeUntilNextCall(): number {
    if (this.canMakeCall()) return 0;

    const oldestCall = Math.min(...this.callTimestamps);
    const timeUntilExpiry = (oldestCall + this.windowMs - Date.now()) / 1000;
    return Math.max(0, Math.ceil(timeUntilExpiry));
  }

  // Make a request (queued if necessary)
  async makeRequest<T>(requestFn: () => Promise<T>, priority: 'high' | 'low' = 'high'): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
        priority,
        execute: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Add to queue based on priority
      if (priority === 'high') {
        // High priority requests go to the front
        const highPriorityIndex = this.requestQueue.findIndex(r => r.priority === 'low');
        if (highPriorityIndex === -1) {
          this.requestQueue.push(request);
        } else {
          this.requestQueue.splice(highPriorityIndex, 0, request);
        }
      } else {
        // Low priority requests go to the back
        this.requestQueue.push(request);
      }

      this.emitStatusUpdate();
    });
  }

  // Process the request queue
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (true) {
      try {
        // Check if we can make a call
        if (!this.canMakeCall()) {
          // Wait until we can make the next call
          const waitTime = this.getTimeUntilNextCall() * 1000;
          if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime + 100)); // +100ms buffer
          }
          continue;
        }

        // Get next request from queue
        const request = this.requestQueue.shift();
        if (!request) {
          // No requests in queue, wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        try {
          // Execute the request
          this.recordCall();
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Clear low priority requests (useful when rate limited)
  clearLowPriorityRequests() {
    const removedCount = this.requestQueue.length;
    this.requestQueue = this.requestQueue.filter(request => request.priority === 'high');
    const actualRemoved = removedCount - this.requestQueue.length;

    if (actualRemoved > 0) {
      this.emitStatusUpdate();
    }
  }

  // Get queue info
  getQueueInfo() {
    const highPriority = this.requestQueue.filter(r => r.priority === 'high').length;
    const lowPriority = this.requestQueue.filter(r => r.priority === 'low').length;

    return {
      total: this.requestQueue.length,
      highPriority,
      lowPriority,
    };
  }

  // Emit status update to all listeners
  private emitStatusUpdate() {
    const status = this.getStatus();
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {}
    });
  }

  // Get estimated wait time for a new request
  getEstimatedWaitTime(priority: 'high' | 'low' = 'high'): number {
    const status = this.getStatus();

    if (status.remainingCalls > 0) {
      return 0; // Can execute immediately
    }

    // Calculate position in queue
    let position = 0;
    if (priority === 'high') {
      position = this.requestQueue.filter(r => r.priority === 'high').length;
    } else {
      position = this.requestQueue.length;
    }

    // Estimate wait time: time until next call + (position * average call interval)
    const avgCallInterval = this.windowMs / this.maxCalls; // 12 seconds between calls on average
    return status.timeUntilNext + (position * avgCallInterval) / 1000;
  }
}

// Global instance
export const polygonRateLimiter = new PolygonRateLimiter();
