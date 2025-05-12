import type React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { adminNavItems, APP_NAME } from '@/config/site';
import { LOGIN_PATH } from '@/lib/constants';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarTrigger, 
  SidebarInset
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ExpiringPackages } from '@/components/admin/expiring-packages';
import { BangladeshInfo } from '@/components/admin/bangladesh-info';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function AdminPreloader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium animate-pulse">Loading Admin Panel...</p>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect(LOGIN_PATH); 
  }

  return (
    <SidebarProvider defaultOpen>
      <Suspense fallback={<AdminPreloader />}>
        <Sidebar className="animate-in slide-in-from-left duration-500">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
              <Link 
                href="/admin/dashboard" 
                className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
              >
                {APP_NAME}
              </Link>
              <SidebarTrigger className="hidden md:flex hover:bg-accent transition-colors duration-200" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <div className="p-2">
                <SidebarNav items={adminNavItems} />
              </div>
            </ScrollArea>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <AppHeader currentUser={user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BangladeshInfo />
              <ExpiringPackages />
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
}

