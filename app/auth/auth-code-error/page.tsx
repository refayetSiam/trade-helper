'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
          <CardDescription>
            We encountered an issue while signing you in. This could be due to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• The authorization code expired or was invalid</li>
            <li>• Network connectivity issues</li>
            <li>• Temporary service unavailability</li>
          </ul>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4">
            If this problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
