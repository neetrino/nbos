'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';
import {
  PAGE_HERO_TAB_BUTTON,
  PAGE_HERO_TAB_ICON,
  PAGE_HERO_TAB_ICON_WRAP,
} from './page-hero-layout';

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
}

export function PageHeroTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  dimmed = false,
}: PageHeroTabsProps<T>) {
  return (
    <div
      className={cn(PAGE_HERO_PILL_GROUP, dimmed && 'opacity-45', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = !dimmed && option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              PAGE_HERO_TAB_BUTTON,
              active
                ? 'bg-primary text-primary-foreground shadow-md'
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
