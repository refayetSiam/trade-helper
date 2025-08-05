import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';

  try {
    console.log(`🧪 Testing Yahoo Finance API with symbol: ${symbol}`);

    // Test basic quote first
    const quote = await yahooFinanceService.getQuote(symbol);
    console.log('✅ Quote test successful:', quote);

    // Test options chain
    const optionsChain = await yahooFinanceService.getOptionsChain(symbol);
    console.log('✅ Options chain test successful');
    console.log(`📊 Found ${optionsChain.options.length} expiration dates`);

    return NextResponse.json({
      success: true,
      symbol,
      quote,
      optionsCount: optionsChain.options.length,
      firstExpiry: optionsChain.options[0]
        ? {
            date: new Date(optionsChain.options[0].expirationDate * 1000).toLocaleDateString(),
            callsCount: optionsChain.options[0].calls.length,
            putsCount: optionsChain.options[0].puts.length,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Yahoo Finance test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        symbol,
      },
      { status: 500 }
    );
  }
}
