'use client';

import { useRef, type KeyboardEvent, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { NBOS_TYPED_DATE_PART_PLACEHOLDERS } from './date-picker-constants';
import {
  adjacentTypedDatePart,
  TYPED_DATE_PART_ORDER,
  type TypedDatePartKey,
  type TypedDateParts,
} from './date-picker-typed';

const PART_LABEL: Record<TypedDatePartKey, string> = {
  day: 'Day',
  month: 'Month',
  year: 'Year',
};

export interface NbosDateTypedInputProps {
  value: TypedDateParts;
  onPartChange: (part: TypedDatePartKey, raw: string) => boolean;
  onCommit: () => void;
  disabled?: boolean;
  className?: string;
}

/** Three independent day / month / year cells above the calendar. */
export function NbosDateTypedInput({
  value,
  onPartChange,
  onCommit,
  disabled = false,
  className,
}: NbosDateTypedInputProps) {
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const refs = { day: dayRef, month: monthRef, year: yearRef };

  const focusPart = (part: TypedDatePartKey | undefined) => {
    if (part) refs[part].current?.focus();
  };

  const handleChange = (part: TypedDatePartKey, raw: string) => {
    if (onPartChange(part, raw)) focusPart(adjacentTypedDatePart(part, 1));
  };

  return (
    <div
      role="group"
      aria-label="Type date as day, month, year"
      className={cn(
        'border-border/50 flex h-10 w-full overflow-hidden rounded-xl border',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {TYPED_DATE_PART_ORDER.map((part, index) => (
        <TypedDatePartCell
          key={part}
          part={part}
          inputRef={refs[part]}
          value={value[part]}
          disabled={disabled}
          showDivider={index > 0}
          onChange={handleChange}
          onCommit={onCommit}
          onMove={(direction) => focusPart(adjacentTypedDatePart(part, direction))}
        />
      ))}
    </div>
  );
}

function TypedDatePartCell({
  part,
  inputRef,
  value,
  disabled,
  showDivider,
  onChange,
  onCommit,
  onMove,
}: {
  part: TypedDatePartKey;
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  disabled: boolean;
  showDivider: boolean;
  onChange: (part: TypedDatePartKey, raw: string) => void;
  onCommit: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCommit();
      return;
    }
    const caret = event.currentTarget.selectionStart ?? 0;
    if (event.key === 'ArrowLeft' && caret === 0) {
      event.preventDefault();
      onMove(-1);
      return;
    }
    if (event.key === 'ArrowRight' && caret === event.currentTarget.value.length) {
      event.preventDefault();
      onMove(1);
      return;
    }
    if (event.key === 'Backspace' && event.currentTarget.value === '') {
      event.preventDefault();
      onMove(-1);
    }
  };

  return (
    <>
      {showDivider ? (
        <span className="bg-border/50 w-px shrink-0 self-stretch" aria-hidden />
      ) : null}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        placeholder={NBOS_TYPED_DATE_PART_PLACEHOLDERS[part]}
        aria-label={PART_LABEL[part]}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onChange(part, event.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'text-foreground min-w-0 bg-transparent text-center text-sm tabular-nums outline-none',
          'placeholder:text-muted-foreground/45 focus:bg-muted/35',
          part === 'year' ? 'flex-[1.6]' : 'flex-1',
        )}
      />
    </>
  );
}
