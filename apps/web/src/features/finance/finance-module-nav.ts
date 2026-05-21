import {
  Banknote,
  CalendarDays,
  CreditCard,
  FileChartColumn,
  FileText,
  LayoutDashboard,
  PieChart,
  Receipt,
  RefreshCw,
  ScrollText,
  ServerCog,
  ShoppingCart,
  Users,
} from 'lucide-react';
import type { PageHeroNavLinkItem } from '@/components/shared/page-hero/PageHeroNavLinks';
import { resolveFinanceSectionId } from '@/lib/navigation/module-last-visit';

const FINANCE_EXPENSE_PLANS_PREFIX = '/finance/expenses/plans';
const FINANCE_EXPENSES_PREFIX = '/finance/expenses';

export const FINANCE_OVERVIEW_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/finance/reports', label: 'Reports', icon: FileChartColumn },
  { href: '/finance/journal', label: 'Journal', icon: ScrollText },
];

export const FINANCE_REVENUE_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance/payments', label: 'Payments', icon: CreditCard },
  { href: '/finance/subscriptions', label: 'Subscriptions', icon: RefreshCw },
];

export const FINANCE_EXPENSES_NAV: PageHeroNavLinkItem[] = [
  {
    href: FINANCE_EXPENSES_PREFIX,
    label: 'Pay Now',
    icon: Receipt,
    matchPrefix: FINANCE_EXPENSES_PREFIX,
    excludeMatchPrefix: FINANCE_EXPENSE_PLANS_PREFIX,
  },
  {
    href: FINANCE_EXPENSE_PLANS_PREFIX,
    label: 'Expenses Plan',
    icon: CalendarDays,
    matchPrefix: FINANCE_EXPENSE_PLANS_PREFIX,
  },
  {
    href: '/finance/client-services',
    label: 'Client services',
    icon: ServerCog,
    matchPrefix: '/finance/client-services',
  },
];

export const FINANCE_PAYROLL_NAV: PageHeroNavLinkItem[] = [
  { href: '/finance/payroll', label: 'Payroll', icon: Banknote },
  { href: '/finance/salary', label: 'Salary', icon: Users },
  { href: '/finance/bonus-pools', label: 'Bonus pools', icon: PieChart },
  { href: '/bonus', label: 'Bonus', icon: PieChart },
];

/** Zone tabs for the current Finance route; `null` = no section pills. */
export function resolveFinanceZoneNav(pathname: string): PageHeroNavLinkItem[] | null {
  const nav = resolveFinanceZoneNavItems(pathname);
  if (!nav || nav.length <= 1) {
    return null;
  }
  return nav;
}

function resolveFinanceZoneNavItems(pathname: string): PageHeroNavLinkItem[] | null {
  const zone = resolveFinanceSectionId(pathname);
  switch (zone) {
    case 'overview':
      return FINANCE_OVERVIEW_NAV;
    case 'revenue':
      return FINANCE_REVENUE_NAV;
    case 'expenses':
      return FINANCE_EXPENSES_NAV;
    case 'payroll':
      return FINANCE_PAYROLL_NAV;
    default:
      return null;
  }
}
