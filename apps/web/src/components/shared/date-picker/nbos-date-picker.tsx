'use client';

import { useCallback, useMemo, useState, type RefObject } from 'react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  NBOS_DATE_PICKER_DEFAULT_LOCALE,
  NBOS_DATE_PICKER_EXTENDED_WIDTH_PX,
} from './date-picker-constants';
import {
  formatDateDisplay,
  formatDateDisplayShort,
  formatDatetimeLocalValue,
  formatIsoDateValue,
  parseDatetimeLocalValue,
  parseIsoDateValue,
} from './date-picker-format';
import { NbosDatePickerMainColumn } from './nbos-date-picker-main-column';
import { NbosDatePresetsPanel } from './nbos-date-presets-panel';
import { NbosDatePickerTrigger } from './nbos-date-picker-trigger';
import { useDatePickerTypedDraft } from './use-date-picker-typed-draft';

export type NbosDatePickerVariant = 'compact' | 'extended';
export type NbosDatePickerMode = 'date' | 'datetime';

export interface NbosDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  variant?: NbosDatePickerVariant;
  mode?: NbosDatePickerMode;
  locale?: string;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  /** Render trigger without outer border (inside field shells). */
  embedded?: boolean;
  /** Raised pill button (icon-only when empty — no placeholder dash). */
  iconButtonShell?: boolean;
  /** Position popover relative to this element instead of the trigger (e.g. full form row). */
  popoverAnchorRef?: RefObject<HTMLElement | null>;
  popoverAlign?: 'start' | 'center' | 'end';
}

export function NbosDatePicker({
  value,
  onChange,
  variant = 'compact',
  mode = 'date',
  locale = NBOS_DATE_PICKER_DEFAULT_LOCALE,
  disabled = false,
  clearable = false,
  placeholder = 'Select date…',
  className,
  id,
  'aria-label': ariaLabel,
  embedded = false,
  iconButtonShell = false,
  popoverAnchorRef,
  popoverAlign = 'end',
}: NbosDatePickerProps) {
  const parsed = useMemo(
    () => (mode === 'datetime' ? parseDatetimeLocalValue(value) : parseIsoDateValue(value)),
    [mode, value],
  );
  const anchor = useMemo(() => parsed ?? new Date(), [parsed]);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parsed ?? new Date());
  const [timeValue, setTimeValue] = useState(() => (parsed ? format(parsed, 'HH:mm') : '19:00'));

  const { typedDraft, resetTypedDraft, handlePartChange, commitTypedDraft } =
    useDatePickerTypedDraft();

  const applyDate = useCallback(
    (date: Date, closeAfter = mode === 'date', syncTyped = true) => {
      setViewMonth(date);
      if (syncTyped) resetTypedDraft(date);
      if (mode === 'datetime') {
        onChange(commitDatetimeValue(date, timeValue));
        return;
      }
      onChange(formatIsoDateValue(date));
      if (closeAfter) setOpen(false);
    },
    [mode, onChange, resetTypedDraft, timeValue],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) return;
      setViewMonth(parsed ?? new Date());
      resetTypedDraft(parsed);
      if (parsed) setTimeValue(format(parsed, 'HH:mm'));
    },
    [parsed, resetTypedDraft],
  );

  const displayText = useMemo(() => {
    if (iconButtonShell) return formatDateDisplayShort(parsed, locale);
    return formatDateDisplay(parsed, locale, mode === 'datetime');
  }, [iconButtonShell, locale, mode, parsed]);

  const handleClear = useCallback(() => {
    onChange('');
    resetTypedDraft(undefined);
  }, [onChange, resetTypedDraft]);

  const handleTimeChange = useCallback(
    (nextTime: string) => {
      setTimeValue(nextTime);
      if (parsed) onChange(commitDatetimeValue(parsed, nextTime));
    },
    [onChange, parsed],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn('w-full min-w-0 border-0 bg-transparent p-0 shadow-none', className)}
      >
        <NbosDatePickerTrigger
          id={id}
          aria-label={ariaLabel}
          displayValue={displayText}
          placeholder={placeholder}
          disabled={disabled}
          clearable={clearable}
          hasValue={Boolean(parsed)}
          onClear={clearable ? handleClear : undefined}
          embedded={embedded}
          iconButtonShell={iconButtonShell}
          className="w-full min-w-0"
        />
      </PopoverTrigger>
      <PopoverContent
        align={popoverAlign}
        side="bottom"
        sideOffset={6}
        anchor={popoverAnchorRef}
        className={cn(
          'gap-0 rounded-2xl p-4 shadow-xl',
          variant === 'extended'
            ? 'flex flex-row'
            : 'flex w-(--anchor-width) min-w-[17.5rem] flex-col',
        )}
        style={
          variant === 'extended'
            ? {
                width: NBOS_DATE_PICKER_EXTENDED_WIDTH_PX,
                maxWidth: 'min(100vw - 2rem, 100%)',
              }
            : { maxWidth: 'min(100vw - 2rem, 100%)' }
        }
      >
        <NbosDatePickerMainColumn
          typedDraft={typedDraft}
          onTypedPartChange={(part, raw) =>
            handlePartChange(part, raw, (date) => applyDate(date, false, false))
          }
          onTypedCommit={() => commitTypedDraft((date) => applyDate(date, true))}
          disabled={disabled}
          viewMonth={viewMonth}
          selectedDate={parsed}
          locale={locale}
          onViewMonthChange={setViewMonth}
          onSelectDate={applyDate}
          mode={mode}
          timeValue={timeValue}
          onTimeChange={handleTimeChange}
          onClear={handleClear}
          onToday={() => applyDate(new Date())}
          extended={variant === 'extended'}
        />
        {variant === 'extended' ? (
          <NbosDatePresetsPanel
            anchorDate={anchor}
            selectedDate={parsed}
            locale={locale}
            onSelectPreset={(date) => applyDate(date)}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function commitDatetimeValue(date: Date, timeValue: string): string {
  const [hourPart, minutePart] = timeValue.split(':');
  const hours = Number(hourPart ?? 19);
  const minutes = Number(minutePart ?? 0);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 19, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return formatDatetimeLocalValue(next);
}
