'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useRegisterMobileDockItems } from '@/components/layout/MobileModuleDockProvider';
import type { MobileDockItem } from '@/components/layout/mobile-module-dock-types';
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

const EMPTY_MOBILE_DOCK_ITEMS: MobileDockItem[] = [];

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
  const isMobileViewport = useIsMobileViewport();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const dockItems = useMemo<MobileDockItem[]>(
    () =>
      items.map((item) => ({
        id: `page-link:${item.href}`,
        label: item.label,
        icon: item.icon,
        href: item.href,
        active: isNavItemActive(pathname, item),
      })),
    [items, pathname],
  );
  useRegisterMobileDockItems('page', isMobileViewport ? EMPTY_MOBILE_DOCK_ITEMS : dockItems);

  const activeHref = items.find((item) => isNavItemActive(pathname, item))?.href ?? '';

  const getActiveElement = useCallback(
    () => (activeHref ? linkRefs.current.get(activeHref) : undefined),
    [activeHref],
  );

  const { indicator, ready } = useSlidingPillIndicator(
    navRef,
    getActiveElement,
    activeHref,
    false,
  );

  return (
    <nav
      ref={navRef}
      className={cn(
        PAGE_HERO_PILL_GROUP,
        'relative w-max min-w-0 shrink-0 max-md:w-full',
        className,
      )}
      aria-label={ariaLabel}
    >
      <SlidingPillBackdrop
        indicator={indicator}
        ready={ready}
        className="bg-primary shadow-md max-md:shadow-none"
      />
      {items.map((item) => (
        <PageHeroNavLink
          key={item.href}
          item={item}
          active={isNavItemActive(pathname, item)}
          linkRefs={linkRefs}
        />
      ))}
    </nav>
  );
}

function PageHeroNavLink({
  item,
  active,
  linkRefs,
}: {
  item: PageHeroNavLinkItem;
  active: boolean;
  linkRefs: MutableRefObject<Map<string, HTMLAnchorElement>>;
}) {
  const Icon = item.icon;

  return (
    <Link
      ref={(node) => {
        if (node) linkRefs.current.set(item.href, node);
        else linkRefs.current.delete(item.href);
      }}
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={item.label}
      className={cn(
        PAGE_HERO_TAB_BUTTON,
        'relative z-10 max-md:flex-1 max-md:justify-center',
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
}
