import {
  Banknote,
  CalendarDays,
  CreditCard,
  FileChartColumn,
  FileText,
  Grid3x3,
  PieChart,
  Receipt,
  RefreshCw,
  ServerCog,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';

const FINANCE_EXPENSE_PLANS_PREFIX = '/finance/expenses/plans';
const FINANCE_EXPENSES_PREFIX = '/finance/expenses';

export const FINANCE_REVENUE_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance/payments', label: 'Payments', icon: CreditCard },
  { href: '/finance/subscriptions', label: 'Subscriptions', icon: RefreshCw },
];

export const FINANCE_EXPENSES_NAV: PageHeroNavLinkItem[] = [
  {
    href: FINANCE_EXPENSE_PLANS_PREFIX,
    label: 'Plans',
    icon: CalendarDays,
    matchPrefix: FINANCE_EXPENSE_PLANS_PREFIX,
  },
  {
    href: FINANCE_EXPENSES_PREFIX,
    label: 'Board',
    icon: Receipt,
    matchPrefix: FINANCE_EXPENSES_PREFIX,
    excludeMatchPrefix: FINANCE_EXPENSE_PLANS_PREFIX,
  },
];

export const FINANCE_PAYROLL_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/payroll', label: 'Payroll', icon: Banknote },
  { href: '/finance/salary', label: 'Salary board', icon: Grid3x3 },
  { href: '/finance/bonus-pools', label: 'Bonus pools', icon: PieChart },
  { href: '/bonus', label: 'Bonus board', icon: PieChart },
];

export const FINANCE_ANALYTICS_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/reports', label: 'Reports', icon: FileChartColumn },
  { href: '/finance/journal', label: 'Journal', icon: FileChartColumn },
];

export const FINANCE_SERVICES_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/client-services', label: 'Client services', icon: ServerCog },
];

export const FINANCE_WALLET_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/wallet', label: 'My wallet', icon: Wallet },
];

function isRevenuePath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/orders') ||
    pathname.startsWith('/finance/invoices') ||
    pathname.startsWith('/finance/payments') ||
    pathname.startsWith('/finance/subscriptions')
  );
}

function isExpensesPath(pathname: string): boolean {
  return pathname.startsWith(FINANCE_EXPENSES_PREFIX);
}

function isPayrollPath(pathname: string): boolean {
  return (
    pathname.startsWith('/finance/payroll') ||
    pathname.startsWith('/finance/salary') ||
    pathname.startsWith('/finance/bonus-pools') ||
    pathname.startsWith('/bonus')
  );
}

function isAnalyticsPath(pathname: string): boolean {
  return pathname.startsWith('/finance/reports') || pathname.startsWith('/finance/journal');
}

function isServicesPath(pathname: string): boolean {
  return pathname.startsWith('/finance/client-services');
}

function isWalletPath(pathname: string): boolean {
  return pathname.startsWith('/finance/wallet');
}

/** Zone tabs for the current Finance route; `null` = overview/dashboard (no section pills). */
export function resolveFinanceZoneNav(pathname: string): PageHeroNavLinkItem[] | null {
  const nav = resolveFinanceZoneNavItems(pathname);
  if (!nav || nav.length <= 1) {
    return null;
  }
  return nav;
}

function resolveFinanceZoneNavItems(pathname: string): PageHeroNavLinkItem[] | null {
  if (isRevenuePath(pathname)) return FINANCE_REVENUE_NAV;
  if (isExpensesPath(pathname)) return FINANCE_EXPENSES_NAV;
  if (isPayrollPath(pathname)) return FINANCE_PAYROLL_NAV;
  if (isServicesPath(pathname)) return FINANCE_SERVICES_NAV;
  if (isAnalyticsPath(pathname)) return FINANCE_ANALYTICS_NAV;
  if (isWalletPath(pathname)) return FINANCE_WALLET_NAV;
  return null;
}
