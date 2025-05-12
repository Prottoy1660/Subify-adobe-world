
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User as UserIcon, PanelLeft } from 'lucide-react';
import { APP_NAME, LOGIN_PATH } from '@/lib/constants'; 
import { handleLogout } from '@/app/actions';
import type { User } from '@/types';
import { useSidebar } from '@/components/ui/sidebar'; 

interface AppHeaderProps {
  currentUser: User | null;
}

export function AppHeader({ currentUser }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar(); 

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {isMobile && (
         <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
      )}
      <div className="flex items-center gap-2">
        <Link href={currentUser?.role === 'admin' ? '/admin/dashboard' : '/reseller/dashboard'} className="text-xl font-semibold text-primary">
          {APP_NAME}
        </Link>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full transition-transform hover:scale-110 focus:scale-110">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 animate-in fade-in zoom-in-90 duration-150" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSeparator />
              <form action={handleLogout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href={LOGIN_PATH}>Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
