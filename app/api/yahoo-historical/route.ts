import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/lib/services/yahoo-finance';
import { TimeRange } from '@/lib/services/chart-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const range = (searchParams.get('range') || '3M') as TimeRange;
  const interval = searchParams.get('interval');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const chartData = await yahooFinanceService.getHistoricalData(symbol, range, interval);

    return NextResponse.json({
      symbol,
      range,
      interval,
      chartData,
      dataPoints: chartData.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        symbol,
        range,
        interval,
      },
      { status: 500 }
    );
  }
}
