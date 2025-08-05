import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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
