'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const MARKETING_NAV = [
  { href: '/marketing', label: 'Board' },
  { href: '/marketing/attribution', label: 'Attribution Review' },
  { href: '/marketing/dashboard', label: 'Dashboard' },
  { href: '/marketing/settings', label: 'Settings' },
] as const;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav
        className="border-border flex flex-wrap gap-2 border-b pb-3"
        aria-label="Marketing sections"
      >
        {MARKETING_NAV.map((item) => {
          const active =
            item.href === '/marketing'
              ? pathname === '/marketing'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
