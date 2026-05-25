'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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

export function ViewModeSwitch<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel = 'View mode',
}: ViewModeSwitchProps<T>) {
  return (
    <div
      className={cn(
        'bg-muted/70 flex w-fit shrink-0 items-center gap-0.5 rounded-full p-1',
        className,
      )}
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
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {option.icon}
      {option.label}
    </button>
  );
}
