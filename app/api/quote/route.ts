import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';
import {
  authenticateApiRequest,
  createApiError,
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/auth/api-auth';
import { getValidatedParams, quoteRequestSchema } from '@/lib/validation/api-schemas';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate request
    const authContext = await authenticateApiRequest(request);
    if (!authContext.isAuthenticated) {
      return NextResponse.json(createApiError('Authentication required', 401), { status: 401 });
    }

    // 2. Check rate limiting
    const clientId = getClientIdentifier(request, authContext.user?.id);
    const rateLimit = checkRateLimit(clientId, 5 * 60 * 1000, 60); // 60 requests per 5 minutes (higher frequency for quotes)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        createApiError('Rate limit exceeded', 429, { resetTime: rateLimit.resetTime }),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // 3. Validate input parameters
    const validation = getValidatedParams(request.nextUrl.searchParams, quoteRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        createApiError('Invalid request parameters', 400, { errors: validation.errors }),
        { status: 400 }
      );
    }

    const { symbol } = validation.data as { symbol: string };

    // 4. Fetch data from provider
    const quote = await yahooFinanceService.getQuote(symbol);

    // 5. Return successful response with rate limit headers
    return NextResponse.json(quote, {
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
      },
    });
  } catch (error) {
    // Log error for debugging (don't expose to client)
    console.error('Quote API error:', error);

    return NextResponse.json(createApiError('Unable to fetch quote data at this time', 500), {
      status: 500,
    });
  }
}
