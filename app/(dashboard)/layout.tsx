import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import QueryProvider from '@/components/providers/query-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="h-screen flex bg-background">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
