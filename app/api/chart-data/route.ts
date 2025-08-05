import { NextRequest, NextResponse } from 'next/server';
import { dataProvider } from '@/lib/services/data-provider';
import { TimeRange } from '@/lib/services/chart-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const range = (searchParams.get('range') || '1M') as TimeRange;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    console.log(`📊 Fetching chart data for ${symbol} (${range})`);

    // Fetch from data provider (handles source selection and fallback)
    const result = await dataProvider.getChartData(symbol.toUpperCase(), range);

    if (result.data.length === 0) {
      return NextResponse.json(
        {
          error: 'No data available',
          symbol,
          range,
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ Successfully fetched ${result.data.length} data points for ${symbol} (${range}) from ${result.sourceLabel}`
    );
    return NextResponse.json({
      data: result.data,
      freshness: {
        ...result.freshness,
        lastDataDate: result.freshness.lastDataDate,
        expectedDataDate: result.freshness.expectedDataDate,
      },
      source: result.source,
      sourceLabel: result.sourceLabel,
    });
  } catch (error) {
    console.error('Chart data fetch error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        symbol,
        range,
      },
      { status: 500 }
    );
  }
}
