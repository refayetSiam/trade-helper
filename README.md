# AI Trading Analysis Platform

A modern, AI-powered trading analysis platform built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Features

- 🤖 AI-powered stock screening with pattern recognition
- 📊 Comprehensive technical analysis with 20+ indicators
- 🎯 Covered call opportunity screener with Greeks analysis
- 📈 Real-time price updates and interactive charting
- 🔔 Smart alerts for trading opportunities
- 📱 Responsive design optimized for desktop trading
- 🌙 Dark mode by default with light mode option
- 🔐 Secure authentication with Google OAuth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **UI**: Tailwind CSS, Shadcn/ui, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Charts**: TradingView Lightweight Charts, Recharts
- **State Management**: Zustand, TanStack Query
- **Authentication**: Supabase Auth with Google OAuth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Console project (for OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/refayetSiam/trade-helper.git
cd trade-helper
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Google OAuth in Supabase

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://yourproject.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### 4. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Update the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set up database schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Users table is automatically created by Supabase Auth

-- Watchlists table
CREATE TABLE watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbols TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT CHECK (type IN ('PRICE', 'TECHNICAL', 'PATTERN', 'OPTIONS')),
  condition TEXT NOT NULL,
  value DECIMAL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  email_alerts BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'instant',
  default_watchlist_id UUID REFERENCES watchlists(id),
  default_chart_interval TEXT DEFAULT '5m',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own watchlists" ON watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watchlists" ON watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON watchlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON alerts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
trading-bot/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── charts/           # Chart components
│   ├── ui/               # Shadcn/ui components
│   └── trading/          # Trading-specific components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   ├── trading/          # Trading algorithms
│   └── ai/               # AI/ML logic
├── hooks/                 # Custom React hooks
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
```

### Adding new components

Use Shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add [component-name]
```

### Code Quality Tools

- **TypeScript**: Type safety and better development experience
- **ESLint**: Code linting with Next.js configuration
- **Prettier**: Automatic code formatting
- **Husky**: Git hooks for quality checks
- **Commitlint**: Conventional commit message format

### Git Workflow

1. All commits must follow conventional commit format
2. Pre-commit hooks run linting and formatting
3. CI/CD pipeline runs on all pushes and PRs
4. Code must pass all quality checks before merge

## Deployment

The application is optimized for deployment on Vercel and includes automated CI/CD:

### Automatic Deployment

1. Push to `main` branch triggers production deployment
2. Pull requests create preview deployments
3. All deployments include security scanning and code quality checks

### Manual Deployment

1. Connect your GitHub repository to Vercel
2. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main

### GitHub Secrets Setup

For CI/CD pipeline, add these secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
