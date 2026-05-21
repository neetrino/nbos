'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { HeaderNavItem } from './header-context-types';
import { HEADER_CONTEXT_PILL_GROUP, HEADER_CONTEXT_SCROLL } from './header-context-constants';

function isNavItemActive(pathname: string, item: HeaderNavItem): boolean {
  if (item.isActive) {
    return item.isActive(pathname);
  }
  const prefix = item.matchPrefix ?? item.href;
  const excluded =
    item.excludeMatchPrefix !== undefined && pathname.startsWith(item.excludeMatchPrefix);
  if (excluded) {
    return false;
  }
  if (item.exactMatch) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${prefix}/`);
}

export interface HeaderContextNavProps {
  items: HeaderNavItem[];
  ariaLabel: string;
  className?: string;
}

export function HeaderContextNav({ items, ariaLabel, className }: HeaderContextNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={cn(HEADER_CONTEXT_SCROLL, className)} aria-label={ariaLabel}>
      <div className={cn(HEADER_CONTEXT_PILL_GROUP, 'w-max min-w-0')}>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tracking-tight whitespace-nowrap transition-colors sm:px-3.5 sm:py-2',
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {Icon ? (
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full sm:size-7',
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-3.5 sm:size-4" aria-hidden />
                </span>
              ) : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
