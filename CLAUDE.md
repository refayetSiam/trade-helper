# Trading Bot - Supabase Setup Guide

## Project Overview

AI Trading Analysis Platform - A Next.js application for stock trading analysis, portfolio management, and automated trading strategies.

## Supabase Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create account/login
2. Click "New Project"
3. Enter project details:
   - Project name: `trading-bot` (or your preference)
   - Database password: (save this securely)
   - Region: Choose closest to you
4. Wait for project creation (~2 minutes)

### 2. Get Credentials

1. Go to **Settings** → **API**
2. Copy these values to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...[your-anon-key]
   ```

### 3. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - Enable Email Signups: ON
   - Enable Email Confirmations: OFF (for development)

### 4. Database Schema Setup

Create the following tables in **SQL Editor**:

```sql
-- Users profile extension
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Portfolio holdings
CREATE TABLE portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  average_cost DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price alerts
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  condition TEXT NOT NULL, -- 'above' or 'below'
  target_price DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolio" ON portfolio
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Test Application

1. Run `npm run dev`
2. Navigate to http://localhost:3000
3. Try signing up with email/password
4. Check Supabase dashboard for new user

## Development Commands

- Start dev server: `npm run dev`
- Run tests: `npm test`
- Lint code: `npm run lint`
- Type check: `npm run typecheck`

## Common Issues

- **"Unsupported provider" error**: Email authentication not enabled in Supabase
- **DNS error**: Wrong Supabase URL in `.env.local`
- **Auth errors**: Check RLS policies and authentication settings

## API Keys Needed

- `YAHOO_FINANCE_API_KEY`: For real-time stock data (optional in dev with mock data enabled)
- `SENDGRID_API_KEY`: For email alerts (optional)
