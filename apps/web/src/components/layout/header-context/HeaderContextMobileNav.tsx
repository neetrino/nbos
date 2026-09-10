'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useRef, type MutableRefObject, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP, PAGE_HERO_TAB_SCROLL } from '@/components/shared/page-hero/page-hero-constants';
import {
  PAGE_HERO_TAB_BUTTON,
  PAGE_HERO_TAB_ICON,
  PAGE_HERO_TAB_ICON_WRAP,
} from '@/components/shared/page-hero/page-hero-layout';
import {
  SlidingPillBackdrop,
  useSlidingPillIndicator,
  type SlidingPillIndicatorRect,
} from '@/components/shared/page-hero/sliding-pill-indicator';
import type { HeaderNavItem } from './header-context-types';
import { isHeaderNavItemActive } from './header-context-nav-utils';

interface HeaderContextMobileNavProps {
  items: HeaderNavItem[];
  ariaLabel: string;
  className?: string;
}

/** Compact pill switcher for header zone tabs on narrow viewports. */
export function HeaderContextMobileNav({
  items,
  ariaLabel,
  className,
}: HeaderContextMobileNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const activeHref = items.find((item) => isHeaderNavItemActive(pathname, item))?.href ?? '';
  const getActiveElement = useCallback(
    () => (activeHref ? linkRefs.current.get(activeHref) : undefined),
    [activeHref],
  );
  const { indicator, ready } = useSlidingPillIndicator(
    navRef,
    getActiveElement,
    activeHref,
    true,
  );

  return (
    <div className={cn(PAGE_HERO_TAB_SCROLL, 'w-full min-w-0', className)}>
      <HeaderContextMobileNavTrack
        items={items}
        pathname={pathname}
        ariaLabel={ariaLabel}
        navRef={navRef}
        linkRefs={linkRefs}
        indicator={indicator}
        ready={ready}
      />
    </div>
  );
}

function HeaderContextMobileNavTrack({
  items,
  pathname,
  ariaLabel,
  navRef,
  linkRefs,
  indicator,
  ready,
}: {
  items: HeaderNavItem[];
  pathname: string;
  ariaLabel: string;
  navRef: RefObject<HTMLElement | null>;
  linkRefs: MutableRefObject<Map<string, HTMLAnchorElement>>;
  indicator: SlidingPillIndicatorRect | null;
  ready: boolean;
}) {
  return (
    <nav
      ref={navRef}
      className={cn(PAGE_HERO_PILL_GROUP, 'relative w-max min-w-0 shrink-0')}
      aria-label={ariaLabel}
    >
      <SlidingPillBackdrop indicator={indicator} ready={ready} className="bg-primary" />
      {items.map((item) => (
        <HeaderContextMobileNavLink
          key={`${item.href}-${item.label}`}
          item={item}
          active={isHeaderNavItemActive(pathname, item)}
          linkRefs={linkRefs}
        />
      ))}
    </nav>
  );
}

function HeaderContextMobileNavLink({
  item,
  active,
  linkRefs,
}: {
  item: HeaderNavItem;
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
        'relative z-10 shrink-0',
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
