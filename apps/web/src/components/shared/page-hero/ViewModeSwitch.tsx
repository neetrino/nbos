'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_PILL_GROUP } from './page-hero-constants';
import { PAGE_HERO_VIEW_BUTTON } from './page-hero-layout';

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
  return (
    <div
      className={cn(PAGE_HERO_PILL_GROUP, 'shrink-0', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ViewModeButton
          key={option.value}
          option={option}
          active={value === option.value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

function ViewModeButton<T extends string>({
  option,
  active,
  onSelect,
}: {
  option: ViewModeOption<T>;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={option.ariaLabel ?? option.label}
      aria-pressed={active}
      title={option.label}
      className={cn(
        PAGE_HERO_VIEW_BUTTON,
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {option.icon}
    </button>
  );
}
