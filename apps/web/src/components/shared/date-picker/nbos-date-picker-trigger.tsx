'use client';

import { Calendar, X } from 'lucide-react';
import { DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

export interface NbosDatePickerTriggerProps {
  displayValue: string;
  placeholder: string;
  disabled?: boolean;
  clearable?: boolean;
  hasValue: boolean;
  onClear?: () => void;
  /** Inside detail-sheet field shell — no double border. */
  embedded?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function NbosDatePickerTrigger({
  displayValue,
  placeholder,
  disabled,
  clearable,
  hasValue,
  onClear,
  embedded = false,
  className,
  id,
  'aria-label': ariaLabel,
}: NbosDatePickerTriggerProps) {
  return (
    <span
      className={cn(
        'text-foreground flex h-10 w-full min-w-0 items-center gap-2 text-sm transition-colors',
        embedded
          ? 'h-8 min-h-8 border-0 bg-transparent px-0 py-0 shadow-none'
          : cn(
              DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
              'rounded-xl px-3 py-2',
              'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
            ),
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        id={id}
        aria-label={ariaLabel}
        className={cn('min-w-0 flex-1 truncate text-left', !hasValue && 'text-muted-foreground')}
      >
        {hasValue ? displayValue : placeholder}
      </span>
      {clearable && hasValue && onClear ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Clear date"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 shrink-0 cursor-pointer rounded-md p-0.5 outline-none focus-visible:ring-2"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }
          }}
        >
          <X size={14} aria-hidden />
        </span>
      ) : null}
      <Calendar size={16} className="text-muted-foreground shrink-0" aria-hidden />
    </span>
  );
}
