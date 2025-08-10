import { createServerClientSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // Security: Validate redirect URL against allowlist to prevent open redirect attacks
  const requestedNext = requestUrl.searchParams.get('next');
  const ALLOWED_REDIRECTS = ['/charts', '/options', '/watchlist', '/'];
  const next =
    requestedNext && ALLOWED_REDIRECTS.includes(requestedNext) ? requestedNext : '/charts';

  // Handle OAuth provider errors
  if (error) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  try {
    const supabase = await createServerClientSupabase();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    if (!data.session) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    // Success - redirect to destination
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    // Get the correct origin for redirect
    let redirectOrigin;
    if (isLocalEnv) {
      redirectOrigin = requestUrl.origin; // Use localhost in development
    } else if (forwardedHost) {
      redirectOrigin = `https://${forwardedHost}`; // Use Vercel host in production
    } else {
      // Use production URL from environment variable
      redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
    }

    return NextResponse.redirect(`${redirectOrigin}${next}`);
  } catch (err) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }
}
