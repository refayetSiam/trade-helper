import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const quote = await yahooFinanceService.getQuote(symbol);

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        symbol,
      },
      { status: 500 }
    );
  }
}
