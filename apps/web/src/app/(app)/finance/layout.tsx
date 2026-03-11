'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ShoppingCart, FileText, CreditCard, RefreshCw, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/finance/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/finance/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance/payments', label: 'Payments', icon: CreditCard },
  { href: '/finance/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { href: '/finance/expenses', label: 'Expenses', icon: Receipt },
] as const;

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-1 border-b pb-4">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
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
