'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ApiRateCounter from '@/components/shared/api-rate-counter';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('closed');
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null); // Clear user state immediately
      toast.success('Signed out successfully');
      // Use window.location to ensure complete refresh and clear any cached data
      window.location.href = '/login';
    } catch (error) {
      console.error('Signout error:', error);
      toast.error('Error signing out');
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Check market status
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const time = hours * 60 + minutes;

      // Market is open Monday-Friday 9:30 AM - 4:00 PM ET
      // Simplified check (you'd want to handle timezones properly)
      if (day >= 1 && day <= 5 && time >= 570 && time <= 960) {
        setMarketStatus('open');
      } else {
        setMarketStatus('closed');
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      {/* Left Section - Empty for spacing */}
      <div className="flex-1"></div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* API Rate Counter */}
        <ApiRateCounter showDetails={false} />

        {/* Market Status */}
        <Badge variant={marketStatus === 'open' ? 'default' : 'secondary'}>
          Market {marketStatus === 'open' ? 'Open' : 'Closed'}
        </Badge>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
