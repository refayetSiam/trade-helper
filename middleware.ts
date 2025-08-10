import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if environment variables are properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === 'your_supabase_project_url' ||
    supabaseKey === 'your_supabase_anon_key'
  ) {
    // Skip auth checks if Supabase is not configured
    console.warn('Supabase not configured - skipping authentication middleware');

    // Still apply security headers
    const isAPIRoute = request.nextUrl.pathname.startsWith('/api');
    const isStaticAsset = request.nextUrl.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/
    );

    if (isAPIRoute) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    } else if (isStaticAsset) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    }

    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Set cookie on request first
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Update response with new request cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Set cookie on response
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // Remove cookie from request
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        // Update response with new request cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Remove cookie from response
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh session if expired - this will handle token refresh
  let user = null;
  let error = null;

  try {
    const { data, error: authError } = await supabase.auth.getUser();
    user = data?.user;
    error = authError;
  } catch (e) {
    // Handle network errors gracefully
    // For network errors, assume user might be authenticated
    // and let the client-side handle the auth state
  }

  // Skip auth check for auth callback and error pages
  if (
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/auth/auth-code-error')
  ) {
    return response;
  }

  // Protected routes
  const protectedRoutes = ['/covered-calls', '/charts', '/watchlist'];
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Auth routes - redirect to charts if already logged in
  if (['/login', '/register'].includes(request.nextUrl.pathname) && user) {
    return NextResponse.redirect(new URL('/charts', request.url));
  }

  // Add security headers for cache control and additional security
  const isAPIRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticAsset = request.nextUrl.pathname.match(
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/
  );

  if (isAPIRoute) {
    // No cache for API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else if (isStaticAsset) {
    // Long cache for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // Short cache for pages
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  }

  // Additional security headers (if not already set by vercel.json)
  if (!response.headers.get('X-Content-Type-Options')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
