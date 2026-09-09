'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { useRegisterMobileDockItems } from '@/components/layout/MobileModuleDockProvider';
import type { MobileDockItem, MobileDockSource } from '@/components/layout/mobile-module-dock-types';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';
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
  /** Mobile dock group. Filters default to secondary so module section links stay first. */
  dockSource?: MobileDockSource;
}

export function PageHeroTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  dimmed = false,
  dockSource = 'secondary',
}: PageHeroTabsProps<T>) {
  const isMobileViewport = useIsMobileViewport();
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const dockItems = useMemo<MobileDockItem[]>(
    () =>
      options.map((option) => ({
        id: `page-tab:${option.value}`,
        label: option.label,
        icon: option.icon,
        active: !dimmed && option.value === value,
        onSelect: () => onChange(option.value),
      })),
    [dimmed, onChange, options, value],
  );
  useRegisterMobileDockItems(dockSource, dockItems);

  const getActiveElement = useCallback(
    () => (dimmed ? undefined : buttonRefs.current.get(value)),
    [dimmed, value],
  );

  const { indicator, ready } = useSlidingPillIndicator(
    groupRef,
    getActiveElement,
    `${value}:${dimmed}`,
    false,
  );

  if (isMobileViewport) {
    return null;
  }

  return (
    <div
      ref={groupRef}
      className={cn(PAGE_HERO_PILL_GROUP, 'relative shrink-0', dimmed && 'opacity-45', className)}
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
}
