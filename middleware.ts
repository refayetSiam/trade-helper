import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

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

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
