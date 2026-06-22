'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlidingPillBackdrop, useSlidingPillIndicator } from './page-hero/sliding-pill-indicator';

export type SegmentedTabOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Optional icon node (when not using LucideIcon). */
  iconNode?: ReactNode;
};

export interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedTabOption<T>[];
  ariaLabel: string;
  className?: string;
  listClassName?: string;
  buttonClassName?: string;
}

const SEGMENTED_TABS_LIST_CLASS =
  'border-border bg-background relative inline-flex min-w-0 items-center gap-0.5 rounded-lg border p-0.5';

const SEGMENTED_TABS_BUTTON_CLASS =
  'relative z-10 inline-flex shrink-0 items-center justify-center gap-1 rounded-md font-medium outline-offset-2 transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70';

/** Bordered segmented control with sliding primary pill (All / Active / Archived, etc.). */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  listClassName,
  buttonClassName,
}: SegmentedTabsProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const getActiveElement = useCallback(() => buttonRefs.current.get(value), [value]);

  const { indicator, ready } = useSlidingPillIndicator(groupRef, getActiveElement, value, false);

  return (
    <div className={className}>
      <div
        ref={groupRef}
        className={cn(SEGMENTED_TABS_LIST_CLASS, listClassName)}
        role="tablist"
        aria-label={ariaLabel}
      >
        <SlidingPillBackdrop
          indicator={indicator}
          ready={ready}
          className="bg-primary top-0.5 bottom-0.5 rounded-md shadow-sm"
        />
        {options.map((option) => {
          const active = option.value === value;
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
                SEGMENTED_TABS_BUTTON_CLASS,
                'px-3 py-2 text-sm',
                active ? 'text-primary-foreground' : 'text-foreground hover:text-foreground',
                buttonClassName,
              )}
            >
              {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
              {option.iconNode}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
