import { NextRequest, NextResponse } from 'next/server';
import { dataProvider } from '@/lib/services/data-provider';
import {
  authenticateApiRequest,
  createApiError,
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/auth/api-auth';
import { getValidatedParams, optionsRequestSchema } from '@/lib/validation/api-schemas';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate request
    const authContext = await authenticateApiRequest(request);
    if (!authContext.isAuthenticated) {
      return NextResponse.json(createApiError('Authentication required', 401), { status: 401 });
    }

    // 2. Check rate limiting
    const clientId = getClientIdentifier(request, authContext.user?.id);
    const rateLimit = checkRateLimit(clientId, 15 * 60 * 1000, 50); // 50 requests per 15 minutes (lower than chart data)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiError('Rate limit exceeded', 429, { resetTime: rateLimit.resetTime }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // 3. Validate input parameters
    const validation = getValidatedParams(request.nextUrl.searchParams, optionsRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        createApiError('Invalid request parameters', 400, { errors: validation.errors }),
        { status: 400 }
      );
    }

    const { symbol, forceRefresh, maxExpirations } = validation.data as {
      symbol: string;
      forceRefresh?: boolean;
      maxExpirations?: number;
    };

    // 4. Fetch data from provider
    const result = await dataProvider.getOptionsChain(symbol, forceRefresh, maxExpirations);

    // 5. Return successful response with rate limit headers
    return NextResponse.json(
      {
        ...result,
        source: result.source,
        sourceLabel: result.sourceLabel,
      },
      {
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    // Log error for debugging (don't expose to client)
    console.error('Options API error:', error);

    return NextResponse.json(createApiError('Unable to fetch options data at this time', 500), {
      status: 500,
    });
  }
}
