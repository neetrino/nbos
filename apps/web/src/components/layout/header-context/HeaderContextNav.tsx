'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { HeaderNavItem } from './header-context-types';
import {
  HEADER_CONTEXT_SCROLL,
  HEADER_CONTEXT_TAB_ACTIVE,
  HEADER_CONTEXT_TAB_ACTIVE_LABEL,
  HEADER_CONTEXT_TAB_CONNECTOR,
  HEADER_CONTEXT_TAB_INACTIVE,
  HEADER_CONTEXT_TAB_ROW,
} from './header-context-constants';
import { MODULE_SHELL_BRIDGE_FILL } from '@/components/shared/module-shell/module-shell-surface';

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

/** Primary module zones: tab + connector strip; PageHero stays a separate card below. */
export function HeaderContextNav({ items, ariaLabel, className }: HeaderContextNavProps) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  const activeAccent = items.find((item) => isNavItemActive(pathname, item))?.accent;

  return (
    <nav className={cn(HEADER_CONTEXT_SCROLL, 'h-full', className)} aria-label={ariaLabel}>
      <div
        className={cn(
          HEADER_CONTEXT_TAB_ROW,
          activeAccent ? activeAccent.activeRowBorder : undefined,
        )}
      >
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const accent = item.accent;
          if (!active) {
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  HEADER_CONTEXT_TAB_INACTIVE,
                  accent && 'group flex flex-col items-center pb-1',
                  accent?.inactiveHover,
                )}
              >
                {item.label}
                {accent ? (
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 h-0.5 w-9 rounded-full transition-colors',
                      accent.inactiveBar,
                    )}
                  />
                ) : null}
              </Link>
            );
          }
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current="page"
              className={cn(HEADER_CONTEXT_TAB_ACTIVE, accent?.activeShell)}
            >
              {accent ? (
                <span
                  aria-hidden
                  className={cn('absolute inset-x-0 top-0 h-1', accent.activeBar)}
                />
              ) : null}
              <span className={HEADER_CONTEXT_TAB_ACTIVE_LABEL}>{item.label}</span>
              <span
                aria-hidden
                className={
                  accent
                    ? 'h-2.5 w-full shrink-0'
                    : cn(MODULE_SHELL_BRIDGE_FILL, HEADER_CONTEXT_TAB_CONNECTOR)
                }
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
