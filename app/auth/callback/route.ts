import { createServerClientSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const next = requestUrl.searchParams.get('next') ?? '/charts';

  // Handle OAuth provider errors
  if (error) {
    console.error('OAuth provider error:', error);
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  try {
    const supabase = await createServerClientSupabase();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError.message);
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    if (!data.session) {
      console.error('No session created after code exchange');
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
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }
}
