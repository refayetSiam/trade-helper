'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

export default function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [isLoading, setIsLoading] = useState(!initialSession);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    if (!initialSession) {
      supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          setSession(session);
          setIsLoading(false);
        })
        .catch(error => {
          setIsLoading(false);
        });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        // Manually trigger server-side token refresh to update cookies
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          // Error handled silently
        }
      }

      // Handle errors
      if (event === 'USER_UPDATED' && !session) {
        router.push('/login');
      }
    });

    // Set up periodic token refresh check (every 30 minutes)
    const refreshInterval = setInterval(
      async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) {
            // Only redirect if it's an auth error, not a network error
            if (error.message?.includes('invalid') || error.message?.includes('expired')) {
              router.push('/login');
            }
          }
        } catch (error) {
          // Don't redirect on network errors
        }
      },
      30 * 60 * 1000
    ); // 30 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [router, initialSession]);

  return <>{children}</>;
}
