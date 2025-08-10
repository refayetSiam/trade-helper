'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LineChart, LogOut, TrendingUp, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState } from 'react';

const navigation = [
  { name: 'Options', href: '/options', icon: Shield },
  { name: 'Charts', href: '/charts', icon: LineChart },
  { name: 'Watchlist', href: '/watchlist', icon: TrendingUp },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      // Use window.location to ensure complete refresh and clear any cached data
      window.location.href = '/login';
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative flex flex-col h-full bg-card border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          {!isCollapsed && <span className="text-lg font-semibold">Trade Helper</span>}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 rounded-md transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="ml-3">{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t p-2 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn('w-full justify-start', isCollapsed && 'justify-center')}
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Sign Out</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </TooltipProvider>
  );
}
