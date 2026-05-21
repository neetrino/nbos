'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { HeaderNavItem } from './header-context-types';
import {
  HEADER_CONTEXT_SCROLL,
  HEADER_CONTEXT_TAB_ACTIVE,
  HEADER_CONTEXT_TAB_INACTIVE,
  HEADER_CONTEXT_TAB_ROW,
} from './header-context-constants';

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

/** Primary module zones: browser-style tabs that bridge into PageHero below. */
export function HeaderContextNav({ items, ariaLabel, className }: HeaderContextNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={cn(HEADER_CONTEXT_SCROLL, 'h-full', className)} aria-label={ariaLabel}>
      <div className={HEADER_CONTEXT_TAB_ROW}>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={active ? HEADER_CONTEXT_TAB_ACTIVE : HEADER_CONTEXT_TAB_INACTIVE}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
