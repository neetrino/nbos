'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';
import {
  PAGE_HERO_TAB_BUTTON,
  PAGE_HERO_TAB_ICON,
  PAGE_HERO_TAB_ICON_WRAP,
} from './page-hero-layout';
import { SlidingPillBackdrop, useSlidingPillIndicator } from './sliding-pill-indicator';

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

function isNavItemActive(pathname: string, item: PageHeroNavLinkItem): boolean {
  const prefix = item.matchPrefix ?? item.href;
  const excluded =
    item.excludeMatchPrefix !== undefined && pathname.startsWith(item.excludeMatchPrefix);
  if (excluded) return false;
  if (item.exactMatch) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${prefix}/`);
}

export function PageHeroNavLinks({ items, ariaLabel, className }: PageHeroNavLinksProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  const activeHref = items.find((item) => isNavItemActive(pathname, item))?.href ?? '';

  const getActiveElement = useCallback(
    () => (activeHref ? linkRefs.current.get(activeHref) : undefined),
    [activeHref],
  );

  const { indicator, ready } = useSlidingPillIndicator(
    navRef,
    getActiveElement,
    `${activeHref}:${pathname}`,
  );

  return (
    <nav
      ref={navRef}
      className={cn(PAGE_HERO_PILL_GROUP, 'relative w-max min-w-0', className)}
      aria-label={ariaLabel}
    >
      <SlidingPillBackdrop indicator={indicator} ready={ready} className="bg-primary shadow-md" />
      {items.map((item) => {
        const active = isNavItemActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            ref={(node) => {
              if (node) linkRefs.current.set(item.href, node);
              else linkRefs.current.delete(item.href);
            }}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            title={item.label}
            className={cn(
              PAGE_HERO_TAB_BUTTON,
              'relative z-10',
              active
                ? 'text-primary-foreground'
                : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  PAGE_HERO_TAB_ICON_WRAP,
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className={PAGE_HERO_TAB_ICON} aria-hidden />
              </span>
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
