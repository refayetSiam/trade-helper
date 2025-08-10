'use client';

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import QueryProvider from '@/components/providers/query-provider';
import AuthProvider from '@/components/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { Shield, LineChart, TrendingUp } from 'lucide-react';

const pageConfig = {
  '/options': {
    title: 'Options Analyzer',
    subtitle: 'Advanced options analysis for calls and puts with comprehensive strategies',
    icon: Shield,
  },
  '/charts': {
    title: 'Charts',
    subtitle: 'Technical indicators for non-technical traders',
    icon: LineChart,
  },
  '/watchlist': {
    title: 'Watchlist',
    subtitle: 'Track your favorite stocks',
    icon: TrendingUp,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = pageConfig[pathname as keyof typeof pageConfig];

  return (
    <AuthProvider>
      <QueryProvider>
        <div className="h-screen flex bg-background">
          {/* Sidebar */}
          <SidebarNav />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <Header
              title={currentPage?.title}
              subtitle={currentPage?.subtitle}
              icon={currentPage?.icon}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
