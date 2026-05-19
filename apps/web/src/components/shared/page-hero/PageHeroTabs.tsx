'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';

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
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
