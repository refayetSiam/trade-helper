'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

// Mock data - replace with real data from APIs
const marketOverview = [
  { symbol: 'SPY', price: 432.15, change: 2.34, changePercent: 0.54 },
  { symbol: 'QQQ', price: 387.92, change: -1.23, changePercent: -0.32 },
  { symbol: 'IWM', price: 198.45, change: 4.67, changePercent: 2.35 },
  { symbol: 'VIX', price: 18.34, change: -0.89, changePercent: -4.63 },
];

const topMovers = [
  { symbol: 'AAPL', price: 185.23, change: 8.45, changePercent: 4.78, volume: '89.5M' },
  { symbol: 'TSLA', price: 234.67, change: -12.34, changePercent: -5.01, volume: '156.2M' },
  { symbol: 'NVDA', price: 456.78, change: 23.45, changePercent: 5.41, volume: '78.9M' },
  { symbol: 'AMZN', price: 142.89, change: 6.78, changePercent: 4.98, volume: '45.6M' },
];

const watchlist = [
  { symbol: 'MSFT', price: 378.45, change: 2.34, changePercent: 0.62 },
  { symbol: 'GOOGL', price: 134.56, change: -1.45, changePercent: -1.07 },
  { symbol: 'META', price: 298.67, change: 5.67, changePercent: 1.93 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your market overview and portfolio performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$54,231.89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-profit">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-profit">+$1,234.56</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-profit">+2.3%</span> today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 triggered today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73.2%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Major indices and volatility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketOverview.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{item.symbol}</span>
                      <span className="text-sm text-muted-foreground">${item.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}
                      </span>
                      <Badge variant={item.change >= 0 ? 'default' : 'destructive'} className="text-xs">
                        {item.changePercent >= 0 ? (
                          <ArrowUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(item.changePercent).toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Movers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Movers</CardTitle>
              <CardDescription>Stocks with highest volume and price movement</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gainers" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
                  <TabsTrigger value="losers">Top Losers</TabsTrigger>
                </TabsList>
                <TabsContent value="gainers" className="space-y-4 mt-4">
                  {topMovers.filter(stock => stock.change > 0).map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">Vol: {stock.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price}</div>
                        <div className="text-sm text-profit">
                          +{stock.change} (+{stock.changePercent}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="losers" className="space-y-4 mt-4">
                  {topMovers.filter(stock => stock.change < 0).map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-sm text-muted-foreground">Vol: {stock.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price}</div>
                        <div className="text-sm text-loss">
                          {stock.change} ({stock.changePercent}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Watchlist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Watchlist</CardTitle>
                <CardDescription>Your tracked stocks</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {watchlist.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">${stock.price}</div>
                    </div>
                    <div className={`text-sm ${stock.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Symbol
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Latest trading opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-profit/20 bg-profit/5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="bg-profit">BUY</Badge>
                    <span className="text-sm font-medium">AAPL</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Strong bullish pattern detected. RSI oversold, MACD bullish crossover.
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Confidence: 85%
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-warning/20 bg-warning/5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">WATCH</Badge>
                    <span className="text-sm font-medium">TSLA</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Approaching key resistance level. Wait for breakout confirmation.
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Confidence: 67%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}