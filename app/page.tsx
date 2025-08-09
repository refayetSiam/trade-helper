import { createServerClientSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, BarChart3, LineChart, Activity, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createServerClientSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/charts');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <TrendingUp className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Algo Trading Analysis Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Professional-grade trading tools powered by artificial intelligence. Screen stocks,
              analyze patterns, and discover covered call opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Trade Smarter</h2>
            <p className="text-lg text-muted-foreground">
              Advanced tools designed for day traders and swing traders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-background">
              <CardContent className="p-6">
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Algo-Powered Screening</h3>
                <p className="text-muted-foreground">
                  Scan 500+ liquid stocks every 5 minutes with advanced pattern recognition
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <LineChart className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Charts</h3>
                <p className="text-muted-foreground">
                  Technical indicators for non-technical traders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <Activity className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-Time Alerts</h3>
                <p className="text-muted-foreground">
                  Get notified instantly when trading opportunities match your criteria
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Options Analysis</h3>
                <p className="text-muted-foreground">LOC-based covered call strategies</p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Backtesting Engine</h3>
                <p className="text-muted-foreground">
                  Test your strategies with 3 months of historical data
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Trade Recommendations</h3>
                <p className="text-muted-foreground">
                  Algorithm-generated entry/exit points with confidence scores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of traders using algorithms to make better trading decisions
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
