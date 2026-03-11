'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, FileText } from 'lucide-react';
import type { ReactNode } from 'react';

const TABS = [
  { href: '/finance/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
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
