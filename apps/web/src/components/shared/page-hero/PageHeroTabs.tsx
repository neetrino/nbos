'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useRegisterMobileDockItems } from '@/components/layout/MobileModuleDockProvider';
import type { MobileDockItem } from '@/components/layout/mobile-module-dock-types';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP, PAGE_HERO_TAB_SCROLL } from './page-hero-constants';
import {
  PAGE_HERO_TAB_BUTTON,
  PAGE_HERO_TAB_ICON,
  PAGE_HERO_TAB_ICON_WRAP,
} from './page-hero-layout';
import { SlidingPillBackdrop, useSlidingPillIndicator } from './sliding-pill-indicator';

export type PageHeroTabOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export interface PageHeroTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: PageHeroTabOption<T>[];
  ariaLabel: string;
  className?: string;
  /** When true, tabs look inactive (e.g. lifecycle overlay). */
  dimmed?: boolean;
  /** When false, mobile does not duplicate these tabs into the dock. */
  registerMobileDock?: boolean;
  /** When true, render the pill switcher on mobile (default hides; dock may own the tabs). */
  showOnMobile?: boolean;
  /**
   * Mobile: stretch pills across the row.
   * Default scrolls horizontally so long option lists stay reachable.
   */
  fullWidthOnMobile?: boolean;
}

const EMPTY_MOBILE_DOCK_ITEMS: MobileDockItem[] = [];

export function PageHeroTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  dimmed = false,
  registerMobileDock = true,
  showOnMobile = false,
  fullWidthOnMobile = false,
}: PageHeroTabsProps<T>) {
  const isMobileViewport = useIsMobileViewport();
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const shouldRegisterDock = registerMobileDock && !(isMobileViewport && showOnMobile);
  const stretchMobile = Boolean(isMobileViewport && showOnMobile && fullWidthOnMobile);
  const scrollMobile = Boolean(isMobileViewport && showOnMobile && !fullWidthOnMobile);
  const dockItems = useMemo<MobileDockItem[]>(
    () =>
      shouldRegisterDock
        ? options.map((option) => ({
            id: `page-tab:${option.value}`,
            label: option.label,
            icon: option.icon,
            active: !dimmed && option.value === value,
            onSelect: () => onChange(option.value),
          }))
        : EMPTY_MOBILE_DOCK_ITEMS,
    [dimmed, onChange, options, shouldRegisterDock, value],
  );
  useRegisterMobileDockItems('secondary', dockItems);

  const getActiveElement = useCallback(
    () => (dimmed ? undefined : buttonRefs.current.get(value)),
    [dimmed, value],
  );

  const { indicator, ready } = useSlidingPillIndicator(
    groupRef,
    getActiveElement,
    `${value}:${dimmed}`,
    scrollMobile,
  );

  if (isMobileViewport && !showOnMobile) {
    return null;
  }

  const tabs = (
    <div
      ref={groupRef}
      className={cn(
        PAGE_HERO_PILL_GROUP,
        'relative min-w-0 shrink-0',
        stretchMobile ? 'w-full' : 'w-max',
        dimmed && 'opacity-45',
        !scrollMobile ? className : undefined,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {!dimmed ? (
        <SlidingPillBackdrop
          indicator={indicator}
          ready={ready}
          className="bg-primary shadow-[0_8px_18px_-8px_var(--primary-glow)] max-md:shadow-none"
        />
      ) : null}
      {options.map((option) => {
        const active = !dimmed && option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) buttonRefs.current.set(option.value, node);
              else buttonRefs.current.delete(option.value);
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              PAGE_HERO_TAB_BUTTON,
              'relative z-10',
              stretchMobile && 'max-md:flex-1 max-md:justify-center',
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
            {option.label}
          </button>
        );
      })}
    </div>
  );

  if (!scrollMobile) {
    return tabs;
  }

  return <div className={cn(PAGE_HERO_TAB_SCROLL, 'w-full min-w-0', className)}>{tabs}</div>;
}
