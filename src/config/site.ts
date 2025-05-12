import type { LucideProps } from 'lucide-react'; 
import { ADMIN_DASHBOARD_PATH, RESELLER_DASHBOARD_PATH, RESELLER_SUBMIT_PATH, APP_NAME } from '@/lib/constants';

export interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof import('lucide-react'); 
  label?: string;
  disabled?: boolean;
}

export const resellerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: RESELLER_DASHBOARD_PATH,
    icon: 'LayoutDashboard',
  },
  {
    title: 'New Submission',
    href: RESELLER_SUBMIT_PATH,
    icon: 'FilePlus',
  },
  {
    title: 'Payments',
    href: '/reseller/payments',
    icon: 'Wallet',
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: ADMIN_DASHBOARD_PATH,
    icon: 'LayoutDashboard',
  },
  {
    title: 'Add Customer',
    href: '/admin/add-customer',
    icon: 'UserPlus',
  },
  {
    title: 'Resellers',
    href: '/admin/resellers',
    icon: 'Users',
  },
  {
    title: 'Login History',
    href: '/admin/login-history',
    icon: 'History',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
];

// AppName is directly imported from constants, so this re-export is fine or could be removed if components import directly.
export { APP_NAME }; 
