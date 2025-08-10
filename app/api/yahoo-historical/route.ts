import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';
import {
  authenticateApiRequest,
  createApiError,
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/auth/api-auth';
import { getValidatedParams, historicalDataRequestSchema } from '@/lib/validation/api-schemas';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate request
    const authContext = await authenticateApiRequest(request);
    if (!authContext.isAuthenticated) {
      return NextResponse.json(createApiError('Authentication required', 401), { status: 401 });
    }

    // 2. Check rate limiting
    const clientId = getClientIdentifier(request, authContext.user?.id);
    const rateLimit = checkRateLimit(clientId, 15 * 60 * 1000, 100); // 100 requests per 15 minutes

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiError('Rate limit exceeded', 429, { resetTime: rateLimit.resetTime }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // 3. Validate input parameters
    const validation = getValidatedParams(
      request.nextUrl.searchParams,
      historicalDataRequestSchema
    );
    if (!validation.success) {
      return NextResponse.json(
        createApiError('Invalid request parameters', 400, { errors: validation.errors }),
        { status: 400 }
      );
    }

    const { symbol, range, interval } = validation.data as {
      symbol: string;
      range: any;
      interval: string | null;
    };

    // 4. Fetch data from provider
    const chartData = await yahooFinanceService.getHistoricalData(symbol, range, interval);

    // 5. Return successful response with rate limit headers
    return NextResponse.json(
      {
        symbol,
        range,
        interval,
        chartData,
        dataPoints: chartData.length,
      },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    // Log error for debugging (don't expose to client)
    console.error('Historical data API error:', error);

    return NextResponse.json(createApiError('Unable to fetch historical data at this time', 500), {
      status: 500,
    });
  }
}
