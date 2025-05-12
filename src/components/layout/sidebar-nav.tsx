'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/site';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import * as LucideIcons from 'lucide-react';
import type React from 'react';

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const IconComponent = LucideIcons[item.icon] as React.FC<LucideIcons.LucideProps> | undefined;
        
        if (!IconComponent) {
          console.warn(`Icon not found: ${item.icon}`);
          // Optionally render a fallback icon or null
          // For now, we'll skip rendering the icon if not found to avoid breaking UI
        }

        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

        return (
          <SidebarMenuItem key={index}>
            <Link href={item.disabled ? '#' : item.href} className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
              item.disabled && 'pointer-events-none opacity-50'
            )}>
              {IconComponent ? <IconComponent className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} /> : <LucideIcons.HelpCircle className="h-5 w-5 shrink-0 text-muted-foreground" /> }
              <span>{item.title}</span>
              {item.label && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.label}
                </span>
              )}
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
