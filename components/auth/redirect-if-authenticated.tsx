'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function RedirectIfAuthenticated() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          return; // Skip auth check if not configured
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          router.push('/charts');
        }
      } catch (error) {
        // Silently handle error - user stays on landing page
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  return null; // This component doesn't render anything
}
