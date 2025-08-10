import { NextRequest, NextResponse } from 'next/server';
import { dataProvider } from '@/lib/services/data-provider';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const forceRefresh = searchParams.get('refresh') === 'true';
  const maxExpirations = searchParams.get('maxExpirations');

  if (!symbol) {
    return NextResponse.json(
      {
        error: 'Symbol parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    const result = await dataProvider.getOptionsChain(
      symbol.toUpperCase(),
      forceRefresh,
      maxExpirations ? parseInt(maxExpirations) : undefined
    );

    return NextResponse.json({
      ...result,
      source: result.source,
      sourceLabel: result.sourceLabel,
    });
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
