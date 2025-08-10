import { NextRequest } from 'next/server';
import { createServerClientSupabase } from '@/lib/supabase/server';

export interface ApiAuthContext {
  user: {
    id: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Middleware to authenticate API requests using Supabase JWT tokens
 * Returns authentication context or throws error for unauthorized access
 */
export async function authenticateApiRequest(request: NextRequest): Promise<ApiAuthContext> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl === 'your_supabase_project_url' ||
      supabaseKey === 'your_supabase_anon_key'
    ) {
      console.error('Supabase environment variables not configured properly');
      return {
        user: null,
        isAuthenticated: false,
      };
    }

    const supabase = await createServerClientSupabase();

    // Get user from Supabase session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        isAuthenticated: false,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
      },
      isAuthenticated: true,
    };
  } catch (error) {
    return {
      user: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Helper function to create standardized API error responses
 */
export function createApiError(message: string, status: number, details?: any) {
  return {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
  };
}

/**
 * Rate limiting store - in production, use Redis or database
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiting (for production, use Redis)
 */
export function checkRateLimit(
  identifier: string,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remainingRequests: maxRequests - 1, resetTime };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remainingRequests: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);
  return {
    allowed: true,
    remainingRequests: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier for rate limiting (IP address + user ID if authenticated)
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  return userId ? `${ip}-${userId}` : ip;
}
