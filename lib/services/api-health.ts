import { yahooFinanceService } from './yahoo-finance';
import { polygonService } from './polygon';

export interface ApiHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastChecked: number;
  responseTime?: number;
}

export interface ApiHealthSummary {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ApiHealthStatus[];
  recommendations?: string[];
}

class ApiHealthService {
  private lastHealthCheck: ApiHealthSummary | null = null;
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Perform a comprehensive health check of all API services
   */
  async checkApiHealth(forceRefresh = false): Promise<ApiHealthSummary> {
    // Return cached results if recent and not forcing refresh
    if (
      !forceRefresh &&
      this.lastHealthCheck &&
      Date.now() - Math.min(...this.lastHealthCheck.services.map(s => s.lastChecked)) <
        this.healthCheckInterval
    ) {
      return this.lastHealthCheck;
    }

    const services: ApiHealthStatus[] = [];

    // Check Yahoo Finance
    services.push(await this.checkYahooFinanceHealth());

    // Check Polygon
    services.push(await this.checkPolygonHealth());

    // Determine overall health
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (unhealthyCount === services.length) {
      overall = 'unhealthy';
      recommendations.push(
        'All data sources are unavailable. Check your internet connection and API keys.'
      );
    } else if (unhealthyCount > 0 || degradedCount > 0) {
      overall = 'degraded';
      recommendations.push(
        'Some data sources are experiencing issues. Service may be slower than usual.'
      );
    } else {
      overall = 'healthy';
    }

    // Add specific recommendations based on service status
    services.forEach(service => {
      if (service.status === 'unhealthy') {
        if (service.service === 'Yahoo Finance') {
          recommendations.push('Yahoo Finance is unavailable - ensure you have internet access.');
        } else if (service.service === 'Polygon') {
          recommendations.push(
            'Polygon API is failing - check your API key in environment variables.'
          );
        }
      }
    });

    const healthSummary: ApiHealthSummary = {
      overall,
      services,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };

    this.lastHealthCheck = healthSummary;

    return healthSummary;
  }

  /**
   * Check Yahoo Finance API health
   */
  private async checkYahooFinanceHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    try {
      const success = await yahooFinanceService.testConnection('AAPL');
      const responseTime = Date.now() - startTime;

      if (success) {
        return {
          service: 'Yahoo Finance',
          status: responseTime > 5000 ? 'degraded' : 'healthy',
          message: responseTime > 5000 ? 'Responding slowly' : 'Service operational',
          lastChecked: Date.now(),
          responseTime,
        };
      } else {
        return {
          service: 'Yahoo Finance',
          status: 'unhealthy',
          message: 'Connection test failed',
          lastChecked: Date.now(),
          responseTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      return {
        service: 'Yahoo Finance',
        status: 'unhealthy',
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        lastChecked: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Polygon API health
   */
  private async checkPolygonHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    try {
      // Try to get a simple quote to test the API
      const result = await polygonService.getLastQuote('AAPL', 'low'); // Use low priority for health check
      const responseTime = Date.now() - startTime;

      if (result && result.price > 0) {
        return {
          service: 'Polygon',
          status: responseTime > 10000 ? 'degraded' : 'healthy',
          message: responseTime > 10000 ? 'Responding slowly' : 'Service operational',
          lastChecked: Date.now(),
          responseTime,
        };
      } else {
        return {
          service: 'Polygon',
          status: 'unhealthy',
          message: 'Invalid response received',
          lastChecked: Date.now(),
          responseTime,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      let status: 'degraded' | 'unhealthy' = 'unhealthy';
      let message = `Error: ${errorMsg}`;

      // Check for specific error types that might indicate configuration issues
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        message = 'API key authentication failed - check POLYGON_API_KEY environment variable';
      } else if (errorMsg.includes('403')) {
        message = 'Access denied - check API key permissions';
      } else if (errorMsg.includes('429')) {
        status = 'degraded';
        message = 'Rate limit exceeded - service temporarily throttled';
      } else if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) {
        message = 'Network connectivity issues';
      }

      return {
        service: 'Polygon',
        status,
        message,
        lastChecked: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get a simple status summary for display
   */
  async getStatusSummary(): Promise<string> {
    const health = await this.checkApiHealth();
    const healthyCount = health.services.filter(s => s.status === 'healthy').length;
    const totalCount = health.services.length;

    switch (health.overall) {
      case 'healthy':
        return `All services operational (${healthyCount}/${totalCount})`;
      case 'degraded':
        return `Some issues detected (${healthyCount}/${totalCount} services healthy)`;
      case 'unhealthy':
        return `Service unavailable (${healthyCount}/${totalCount} services healthy)`;
      default:
        return 'Status unknown';
    }
  }

  /**
   * Clear cached health status to force fresh check
   */
  clearHealthCache(): void {
    this.lastHealthCheck = null;
  }
}

export const apiHealthService = new ApiHealthService();
