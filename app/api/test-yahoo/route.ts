import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';

  try {
    // Test basic quote first
    const quote = await yahooFinanceService.getQuote(symbol);

    // Test options chain
    const optionsChain = await yahooFinanceService.getOptionsChain(symbol);

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
