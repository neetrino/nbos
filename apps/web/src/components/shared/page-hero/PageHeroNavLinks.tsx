'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';

export type PageHeroNavLinkItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** When set, active if pathname starts with this prefix (default: href). */
  matchPrefix?: string;
  /** When set, never active if pathname starts with this prefix (e.g. board vs plans under expenses). */
  excludeMatchPrefix?: string;
  /** When true, active only on exact pathname match (e.g. module index route). */
  exactMatch?: boolean;
};

export interface PageHeroNavLinksProps {
  items: PageHeroNavLinkItem[];
  ariaLabel: string;
  className?: string;
}

export function PageHeroNavLinks({ items, ariaLabel, className }: PageHeroNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(PAGE_HERO_PILL_GROUP, 'w-max min-w-0', className)} aria-label={ariaLabel}>
      {items.map((item) => {
        const prefix = item.matchPrefix ?? item.href;
        const excluded =
          item.excludeMatchPrefix !== undefined && pathname.startsWith(item.excludeMatchPrefix);
        const active =
          !excluded &&
          (item.exactMatch
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${prefix}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold tracking-tight whitespace-nowrap transition-colors sm:px-3.5',
              active
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
