'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const TRACK_CLASS =
  'border-border bg-muted/50 flex flex-wrap items-center gap-0.5 rounded-lg border p-0.5';

const SIZE_TRIGGER: Record<'sm' | 'md', string> = {
  sm: 'gap-1.5 rounded-md px-3 py-2 text-xs font-medium',
  md: 'gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
};

export interface SegmentedControlItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  items: SegmentedControlItem<T>[];
  /** `sm` matches Tasks / Work Space runtime toolbars. */
  size?: 'sm' | 'md';
  className?: string;
  trackClassName?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  items,
  size = 'sm',
  className,
  trackClassName,
}: SegmentedControlProps<T>) {
  const triggerSize = SIZE_TRIGGER[size];

  return (
    <div
      className={cn(TRACK_CLASS, trackClassName, className)}
      role="tablist"
      aria-orientation="horizontal"
    >
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={item.ariaLabel}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'flex items-center transition-all',
              triggerSize,
              selected
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.icon ? (
              <span className="inline-flex shrink-0 [&_svg]:pointer-events-none">{item.icon}</span>
            ) : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
