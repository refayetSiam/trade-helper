import { NextRequest, NextResponse } from 'next/server';
import { dataProvider } from '@/lib/services/data-provider';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!symbol) {
    return NextResponse.json(
      {
        error: 'Symbol parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    console.log(
      `🔍 API: Fetching options chain for ${symbol}${forceRefresh ? ' (force refresh)' : ''}`
    );

    const result = await dataProvider.getOptionsChain(symbol.toUpperCase(), forceRefresh);

    console.log(`✅ API: Successfully fetched options for ${symbol} from ${result.sourceLabel}`);
    console.log(`📊 API: ${result.options.length} expiration dates found`);

    return NextResponse.json({
      ...result,
      source: result.source,
      sourceLabel: result.sourceLabel,
    });
  } catch (error) {
    console.error(`❌ API: Error fetching options for ${symbol}:`, error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        symbol,
      },
      { status: 500 }
    );
  }
}
