import { createServerClientSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
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
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 });
    }

    const supabase = await createServerClientSupabase();

    // This will refresh the token if needed
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user, refreshed: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
