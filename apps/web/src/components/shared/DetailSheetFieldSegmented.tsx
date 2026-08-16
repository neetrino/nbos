'use client';

import { useCallback, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_SEGMENTED_BUTTON_CLASS,
  DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_OUTLINED_SEGMENTED_SHELL_CLASS,
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
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>

      <div className={DETAIL_SHEET_OUTLINED_SEGMENTED_SHELL_CLASS}>
        <div
          ref={groupRef}
          className={cn(
            DETAIL_SHEET_FIELD_SEGMENTED_GROUP_CLASS,
            'h-full bg-transparent px-0.5 py-0',
          )}
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
    </div>
  );
}
