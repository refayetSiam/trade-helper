import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'AAPL';

  try {
    console.log(`Testing Yahoo Finance API for ${symbol}...`);

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=1M&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json',
      },
    });

    console.log(`Yahoo Finance API Status: ${response.status}`);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Yahoo Finance API error: ${response.status} ${response.statusText}`,
          status: response.status,
          url: url,
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('Yahoo Finance Response Structure:', {
      hasChart: !!data.chart,
      hasResult: !!data.chart?.result,
      resultsCount: data.chart?.result?.length || 0,
      hasTimestamp: !!data.chart?.result?.[0]?.timestamp,
      timestampCount: data.chart?.result?.[0]?.timestamp?.length || 0,
      hasQuote: !!data.chart?.result?.[0]?.indicators?.quote?.[0],
    });

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return NextResponse.json(
        {
          error: 'No data returned from Yahoo Finance',
          response: data,
        },
        { status: 500 }
      );
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    const sampleData = timestamps?.slice(0, 5).map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString(),
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index],
    }));

    return NextResponse.json({
      success: true,
      symbol: symbol,
      totalDataPoints: timestamps?.length || 0,
      sampleData: sampleData,
      meta: result.meta,
    });
  } catch (error) {
    console.error('Yahoo Finance test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test Yahoo Finance API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
