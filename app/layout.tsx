import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Algo Trading Analysis Platform',
  description:
    'Professional algorithm-powered trading analysis platform with real-time screening, technical analysis, and covered call recommendations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card) / 0.95)',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border) / 0.3)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </body>
    </html>
  );
}
