# Trading Bot - Software Specifications

## Project Overview

**AI Trading Analysis Platform** - A Next.js 15.4.4 application built with TypeScript and React 19 for advanced stock trading analysis, algorithmic pattern detection, and automated trading strategies.

### Architecture

- **Frontend**: Next.js 15.4.4 with App Router, TypeScript, Tailwind CSS v4
- **Authentication**: Supabase Auth with Email/Google OAuth
- **Database**: Supabase PostgreSQL with Row Level Security
- **Charts**: Recharts v3.1.0 for technical analysis, Lightweight Charts for advanced visualization
- **State Management**: Zustand v5.0.6 + React Query v5.83.0
- **Deployment**: Vercel via git push integration

## Core Features

### 1. Trading Algorithms

#### Swing Trading Signals

- **Algorithm**: Multi-indicator confluence detection
- **Timeframe**: 2-3 day holding period
- **Indicators**: RSI, MACD, Support/Resistance, Volume analysis
- **Entry Criteria**: RSI oversold recovery + MACD momentum + support zone
- **Risk Management**: ATR-based stop losses, 2:1 risk/reward targets

#### Intraday Gap-Up Breakout Strategy

- **Algorithm**: 6-step gap detection with momentum confirmation
- **Criteria**:
  - Gap ≥0.3% from previous close
  - Volume ≥1.2x average
  - RSI between 40-80
  - Above 20-day SMA
  - Strong momentum indicators
- **Implementation**: Relaxed thresholds for daily data compatibility

### 2. Chart Analysis Engine

#### Pattern Detection (20+ Algorithms)

- **Candlestick Patterns**: Bullish/Bearish Engulfing, Doji, Hammer, Shooting Star
- **Support/Resistance**: Dynamic level detection with strength scoring
- **Confluence Analysis**: Multiple pattern alignment with probability weighting
- **Confidence Filtering**: Top 3 highest confidence patterns displayed

#### Technical Indicators

- **Trend**: SMA (20/50/200), EMA (12/26), VWAP
- **Momentum**: RSI, MACD, Stochastic, Williams %R
- **Volatility**: Bollinger Bands, ATR
- **Volume**: Volume MA, On-Balance Volume

### 3. Options Trading

#### Black-Scholes Greeks Calculator

- **Calculations**: Delta, Gamma, Theta, Vega, Rho
- **Pricing**: Theoretical option value, intrinsic/time value
- **Implementation**: Custom Black-Scholes without external dependencies

#### Covered Calls Analysis

- **Formulas**:
  - MaxProfit = (min(K – S, 0) + P) × 100 – InterestCost
  - AnnualizedReturn = (MaxProfit / (S × 100)) × (365 / T) × 100
  - BreakEven = S – P
- **Risk Metrics**: Cost of borrowing, max loss, probability of profit

### 4. User Interface

#### Main Application

- **Primary Page**: /charts (main trading interface)
- **Navigation**: Collapsible sidebar with /covered-calls, /watchlist
- **Removed Pages**: dashboard, settings, screener, portfolio, alerts

#### Chart Features

- **Responsive Design**: Dynamic heights (450px mobile, 550px tablet, 650px desktop)
- **Interaction**: Ctrl/Cmd+scroll zoom, pattern overlay visualization
- **Entry/Exit Visualization**: TP/SL/Entry lines with price labels
- **Floating Legend**: Real-time pattern information display

#### UI/UX Improvements

- **Scroll Behavior**: Chart zoom on Ctrl/Cmd, normal page scroll otherwise
- **Decimal Formatting**: 1 decimal place for all stock prices
- **Labeling**: "Algo" terminology instead of "AI"
- **Pattern Filtering**: Maximum 3 patterns to reduce visual clutter

## Application Structure

### Pages

```
/charts          - Main trading analysis interface
/covered-calls   - Options analysis and Greeks calculator
/watchlist       - Stock watchlist management
/login          - Authentication (Email/Google)
/register       - User registration
```

### Key Components

- **StockChart**: Main chart component with pattern overlays
- **PatternEvidencePanel**: Algorithm explanations and evidence
- **PatternDefinitions**: Trading pattern education
- **SidebarNav**: Collapsible navigation with 3 main pages
- **Header**: Market status, API rate counter, user menu

### Database Schema

#### User Management

```sql
profiles (id, email, full_name, subscription_tier, created_at, updated_at)
```

#### Trading Data

```sql
watchlist (id, user_id, symbol, notes, created_at)
portfolio (id, user_id, symbol, quantity, average_cost, created_at, updated_at)
alerts (id, user_id, symbol, condition, target_price, is_active, triggered_at, created_at)
```

#### Security

- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Automatic profile creation on signup

## Data Sources & APIs

### Stock Data

- **Primary**: Polygon.io API (real-time, historical data)
- **Fallback**: Yahoo Finance API (backup/development)
- **Rate Limiting**: Built-in request throttling and monitoring

### API Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
YAHOO_FINANCE_API_KEY=[optional]
POLYGON_API_KEY=[required-for-production]
```

### Data Management

- **Manual Triggers**: No automatic API calls, user-initiated only
- **Caching**: React Query with manual refetch control
- **Error Handling**: Graceful fallback between data sources

## Development Setup

### Prerequisites

- Node.js 18+
- Supabase account and project
- Polygon.io API key (optional: Yahoo Finance)

### Installation

```bash
npm install
npm run dev --turbopack
```

### Development Commands

- **Start**: `npm run dev` (with Turbopack)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (auto-fix with `npm run lint:fix`)
- **Type Check**: `npm run type-check`
- **Format**: `npm run format` (Prettier)

### Git Hooks (Husky)

- **Pre-commit**: ESLint + Prettier auto-formatting
- **Commit Linting**: Conventional commit message format

## Technical Implementation

### Chart Rendering

- **Library**: Recharts ComposedChart for main visualization
- **Performance**: Pattern filtering to prevent overcrowding
- **Responsiveness**: Dynamic sizing based on viewport
- **Interaction**: Zoom controls, collapsible panels

### Pattern Detection Engine

- **Service**: `PatternDetectionService` with 20+ algorithms
- **Real-time Analysis**: Confidence scoring and probability calculation
- **Visual Overlay**: Automatic entry/exit/TP/SL line generation
- **Evidence Tracking**: Detailed algorithm explanations

### State Management

- **Global State**: Zustand for UI state (sidebar collapse, chart settings)
- **Server State**: React Query for API data management
- **Authentication**: Supabase client-side session management

## Deployment

### Vercel Integration

- **Method**: Git push to GitHub → automatic Vercel deployment
- **Environment**: Production environment variables configured
- **Build**: Next.js optimized build with Turbopack

### Performance Optimizations

- **Code Splitting**: Dynamic imports for chart components
- **Caching**: React Query with strategic cache invalidation
- **Bundle Size**: Optimized dependencies and tree shaking

## Troubleshooting

### Common Issues

- **Turbopack Errors**: Clear `.next` directory and `node_modules/.cache`
- **Pattern Not Showing**: Check algorithm thresholds and market hours
- **API Rate Limits**: Monitor usage with built-in rate counter
- **Authentication Redirects**: Verify callback URLs and middleware routes

### Debug Tools

- **React Query Devtools**: Enabled in development
- **Console Logging**: Pattern detection debug output
- **Error Boundaries**: Graceful error handling for chart components

## Trading Algorithm Specifications

### Pattern Confidence Scoring

- **High Confidence**: >75% probability, multiple confirmations
- **Medium Confidence**: 50-75% probability, some confirmations
- **Low Confidence**: <50% probability, weak signals

### Risk Management

- **Stop Loss**: ATR-based calculations (typically 1.5-2x ATR)
- **Take Profit**: Risk/reward ratios of 2:1 or better
- **Position Sizing**: Based on account risk tolerance

### Algorithm Performance

- **Backtesting**: Historical win rates and probability calculations
- **Real-time**: Live pattern detection with confidence intervals
- **Validation**: Multi-timeframe confirmation requirements

## Security & Compliance

### Data Security

- **Row Level Security**: Database-level access control
- **API Key Management**: Environment variable isolation
- **Session Management**: Secure Supabase authentication

### Trading Compliance

- **Educational Purpose**: Platform designed for analysis, not execution
- **Risk Disclosure**: Clear risk warnings and educational content
- **Data Accuracy**: Multiple data source validation

## Performance Metrics

### Application Performance

- **Load Time**: <2 seconds initial load
- **Chart Rendering**: <500ms pattern detection
- **API Response**: <1 second average response time
- **Memory Usage**: Optimized React Query cache management

### Trading Performance

- **Pattern Accuracy**: Algorithm-specific win rates displayed
- **Risk Metrics**: Real-time risk/reward calculations
- **Execution**: Clear entry/exit signals with price targets

## Security Implementation (Updated: January 10, 2025)

### Comprehensive Security Review & Fixes

A complete security audit was performed and all identified vulnerabilities have been resolved. The application now implements enterprise-grade security measures.

### Authentication & Authorization

#### API Authentication

- **JWT Token Validation**: All API endpoints require valid Supabase JWT tokens
- **User Context**: Authenticated user information passed to all API handlers
- **Session Management**: Secure token refresh and validation
- **Implementation**: `/lib/auth/api-auth.ts` - Comprehensive authentication middleware

#### Route Protection

- **Middleware Security**: Enhanced Next.js middleware with authentication checks
- **Protected Routes**: `/charts`, `/options`, `/watchlist` require authentication
- **Auth Flow**: Secure login/logout with proper session management
- **Redirect Security**: Open redirect vulnerability patched with URL allowlist

### Input Validation & Sanitization

#### Zod Schema Validation

- **Strict Validation**: All API parameters validated against schemas
- **Input Sanitization**: XSS prevention with character filtering
- **Type Safety**: TypeScript integration with runtime validation
- **Schema Library**: `/lib/validation/api-schemas.ts`

#### Validation Rules

```typescript
// Stock symbols: Uppercase letters, numbers, dots, hyphens only
symbolSchema: /^[A-Z0-9.-]+$/;

// Time ranges: Enumerated allowed values only
timeRangeSchema: ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '2Y', '5Y', 'MAX'];

// Parameters sanitized to remove HTML/JS injection characters
```

### Rate Limiting & Abuse Prevention

#### API Rate Limits

- **Chart Data**: 100 requests per 15 minutes
- **Options Data**: 50 requests per 15 minutes (more expensive calls)
- **Quote Data**: 60 requests per 5 minutes (frequent updates)
- **Historical Data**: 100 requests per 15 minutes

#### Rate Limiting Implementation

- **Client Identification**: IP address + user ID for accurate limiting
- **Response Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Storage**: In-memory store (production should use Redis)
- **Graceful Degradation**: 429 status with retry information

### Content Security Policy & Headers

#### Security Headers (vercel.json)

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://vercel.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://polygon.io https://query1.finance.yahoo.com https://query2.finance.yahoo.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
}
```

#### Cache Security (middleware.ts)

- **API Routes**: `no-store, no-cache, must-revalidate, private`
- **Static Assets**: `public, max-age=31536000, immutable`
- **Pages**: `private, max-age=0, must-revalidate`

### Error Handling & Information Disclosure

#### Secure Error Responses

- **No Sensitive Data**: Error messages don't expose internal details
- **Standardized Format**: Consistent error structure across all APIs
- **Development vs Production**: Debug details only shown in development
- **Logging**: Server-side error logging without client exposure

#### Error Response Format

```typescript
{
  "error": {
    "message": "Unable to fetch chart data at this time",
    "status": 500,
    "timestamp": "2025-01-10T12:00:00.000Z"
    // No stack traces or internal details exposed
  }
}
```

### API Key & Environment Security

#### Environment Variable Protection

- **No Exposure**: API keys never sent to client-side code
- **Rotation**: Exposed Polygon API key was rotated and secured
- **Validation**: Environment variable validation in middleware and services
- **Documentation**: Clear separation between public and private variables

#### Secured API Keys

- `POLYGON_API_KEY`: Server-side only, validated before use
- `YAHOO_FINANCE_API_KEY`: Optional fallback API key
- `NEXT_PUBLIC_SUPABASE_*`: Public Supabase configuration (safe for client)

### Production Security Measures

#### Removed Attack Vectors

- **Debug Endpoints**: Deleted `/api/test-yahoo` and `/api/test-yahoo-direct`
- **Console Logging**: Removed debug statements from production code
- **Development Fallbacks**: Removed insecure development authentication bypasses

#### Secure Deployment

- **HSTS Enabled**: Forces HTTPS connections
- **CSP Protection**: Prevents XSS and injection attacks
- **Frame Protection**: Prevents clickjacking attacks
- **MIME Type Protection**: Prevents MIME type confusion attacks

### Security Infrastructure Files

```
/lib/auth/api-auth.ts          - Authentication middleware & rate limiting
/lib/validation/api-schemas.ts - Input validation & sanitization schemas
/middleware.ts                 - Enhanced security middleware
/vercel.json                   - Security headers configuration
```

### Security Testing & Validation

#### Comprehensive Testing

- **TypeScript Compilation**: All security fixes pass type checking
- **Build Verification**: Production build compiles successfully
- **Runtime Testing**: Middleware and authentication tested with real credentials
- **Rate Limiting**: Confirmed rate limits work correctly

#### Environment Validation

- **Development**: Graceful handling when Supabase not configured
- **Production**: Full security enforcement with real credentials
- **Error Handling**: Proper fallbacks for all failure scenarios

### Future Security Considerations

#### Production Enhancements

- **Redis Rate Limiting**: Replace in-memory store with Redis for scalability
- **API Key Rotation**: Implement automated key rotation
- **Security Monitoring**: Add security event logging and monitoring
- **Penetration Testing**: Regular security audits and testing

#### Compliance & Monitoring

- **OWASP Guidelines**: Implementation follows OWASP security standards
- **Security Headers**: All major security headers properly configured
- **Regular Updates**: Dependencies and security patches kept current

This security implementation provides enterprise-grade protection against common web application vulnerabilities including XSS, CSRF, injection attacks, rate limiting abuse, and unauthorized access.
