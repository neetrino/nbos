'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';
import { PAGE_HERO_VIEW_BUTTON } from './page-hero-layout';
import { SlidingPillBackdrop, useSlidingPillIndicator } from './sliding-pill-indicator';

export type ViewModeOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  ariaLabel?: string;
};

export interface ViewModeSwitchProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ViewModeOption<T>[];
  className?: string;
  ariaLabel?: string;
}

/** Icon-only view switcher (labels in aria-label / title). */
export function ViewModeSwitch<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel = 'View mode',
}: ViewModeSwitchProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const getActiveElement = useCallback(() => buttonRefs.current.get(value), [value]);

  const { indicator, ready } = useSlidingPillIndicator(groupRef, getActiveElement, value, false);

  return (
    <div
      ref={groupRef}
      className={cn(PAGE_HERO_PILL_GROUP, 'relative shrink-0', className)}
      role="group"
      aria-label={ariaLabel}
    >
      <SlidingPillBackdrop
        indicator={indicator}
        ready={ready}
        className="bg-background shadow-sm"
      />
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) buttonRefs.current.set(option.value, node);
              else buttonRefs.current.delete(option.value);
            }}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.ariaLabel ?? option.label}
            aria-pressed={active}
            title={option.label}
            className={cn(
              PAGE_HERO_VIEW_BUTTON,
              'relative z-10',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
