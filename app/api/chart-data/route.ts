import { NextRequest, NextResponse } from 'next/server';
import { dataProvider } from '@/lib/services/data-provider';
import {
  authenticateApiRequest,
  createApiError,
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/auth/api-auth';
import { getValidatedParams, chartDataRequestSchema } from '@/lib/validation/api-schemas';

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
    const validation = getValidatedParams(request.nextUrl.searchParams, chartDataRequestSchema);
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
    const result = await dataProvider.getChartData(symbol, range, interval);

    if (result.data.length === 0) {
      return NextResponse.json(
        createApiError('No data available for the requested symbol and time range', 404),
        { status: 404 }
      );
    }

    // 5. Return successful response with rate limit headers
    return NextResponse.json(
      {
        symbol,
        range,
        interval,
        dataPoints: result.data.length,
        data: result.data,
        freshness: {
          ...result.freshness,
          lastDataDate: result.freshness.lastDataDate,
          expectedDataDate: result.freshness.expectedDataDate,
        },
        source: result.source,
        sourceLabel: result.sourceLabel,
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
    console.error('Chart data API error:', error);

    return NextResponse.json(createApiError('Unable to fetch chart data at this time', 500), {
      status: 500,
    });
  }
}
