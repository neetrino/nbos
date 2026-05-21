'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ShoppingCart,
  FileText,
  CreditCard,
  RefreshCw,
  ServerCog,
  Receipt,
  Banknote,
  Wallet,
  PieChart,
  FileChartColumn,
  Grid3x3,
  CalendarDays,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/finance/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/finance/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance/payments', label: 'Payments', icon: CreditCard },
  { href: '/finance/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { href: '/finance/client-services', label: 'Client services', icon: ServerCog },
  { href: '/finance/expenses/plans', label: 'Expense plans', icon: CalendarDays },
  { href: '/finance/expenses', label: 'Expense board', icon: Receipt },
  { href: '/finance/payroll', label: 'Payroll', icon: Banknote },
  { href: '/finance/salary', label: 'Salary board', icon: Grid3x3 },
  { href: '/finance/bonus-pools', label: 'Bonus pools', icon: PieChart },
  { href: '/finance/wallet', label: 'My wallet', icon: Wallet },
  { href: '/finance/reports', label: 'Reports', icon: FileChartColumn },
] as const;

const EXPENSE_PLANS_TAB_HREF = '/finance/expenses/plans';
const EXPENSE_BOARD_TAB_HREF = '/finance/expenses';

/** Board and plans share `/finance/expenses/*`; plans path must not activate the board tab. */
function isFinanceTabActive(pathname: string, href: string): boolean {
  if (href === EXPENSE_PLANS_TAB_HREF) {
    return pathname.startsWith(EXPENSE_PLANS_TAB_HREF);
  }
  if (href === EXPENSE_BOARD_TAB_HREF) {
    return (
      pathname.startsWith(EXPENSE_BOARD_TAB_HREF) && !pathname.startsWith(EXPENSE_PLANS_TAB_HREF)
    );
  }
  return pathname.startsWith(href);
}

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-1 border-b pb-4">
        {TABS.map((tab) => {
          const isActive = isFinanceTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 pt-6">{children}</div>
    </div>
  );
}
