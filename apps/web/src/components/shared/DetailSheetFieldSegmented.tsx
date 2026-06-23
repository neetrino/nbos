'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_SEGMENTED_BUTTON_CLASS,
  DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS,
} from './detail-sheet-classes';
import { SlidingPillBackdrop, useSlidingPillIndicator } from './page-hero/sliding-pill-indicator';

export type DetailSheetFieldSegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export interface DetailSheetFieldSegmentedProps<T extends string> {
  label: string;
  icon?: ReactNode;
  value: T | null | undefined;
  options: readonly DetailSheetFieldSegmentedOption<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function DetailSheetFieldSegmented<T extends string>({
  label,
  icon,
  value,
  options,
  onValueChange,
  disabled = false,
  className,
  ariaLabel,
}: DetailSheetFieldSegmentedProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const getActiveElement = useCallback(
    () => (value ? buttonRefs.current.get(value) : undefined),
    [value],
  );

  const { indicator, ready } = useSlidingPillIndicator(
    groupRef,
    getActiveElement,
    value ?? '',
    false,
  );

  return (
    <div className={cn('group relative', disabled && 'pointer-events-none opacity-60', className)}>
      <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
        {label}
      </div>

      <div
        ref={groupRef}
        className={DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS}
        role="tablist"
        aria-label={ariaLabel ?? label}
      >
        <SlidingPillBackdrop
          indicator={indicator}
          ready={ready}
          className="bg-primary top-1 bottom-1 shadow-sm"
        />
        {options.map((option) => {
          const active = option.value === value;
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
              disabled={disabled}
              onClick={() => onValueChange(option.value)}
              className={cn(
                DETAIL_SHEET_FIELD_SEGMENTED_BUTTON_CLASS,
                active
                  ? 'text-primary-foreground'
                  : 'text-foreground/85 hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
