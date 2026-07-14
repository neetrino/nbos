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
import { NbosCalendarGrid } from './nbos-calendar-grid';
import { NbosDatePresetsPanel } from './nbos-date-presets-panel';
import { NbosDatePickerTrigger } from './nbos-date-picker-trigger';
import { NbosTimePicker } from './nbos-time-picker';

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
  const [timeValue, setTimeValue] = useState(() => (parsed ? format(parsed, 'HH:mm') : '09:00'));

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) return;
      setViewMonth(parsed ?? new Date());
      if (parsed) setTimeValue(format(parsed, 'HH:mm'));
    },
    [parsed],
  );

  const displayText = useMemo(() => {
    if (iconButtonShell) return formatDateDisplayShort(parsed, locale);
    return formatDateDisplay(parsed, locale, mode === 'datetime');
  }, [iconButtonShell, locale, mode, parsed]);

  const applyDate = useCallback(
    (date: Date) => {
      if (mode === 'datetime') {
        const [hourPart, minutePart] = timeValue.split(':');
        const hours = Number(hourPart ?? 9);
        const minutes = Number(minutePart ?? 0);
        const next = new Date(date);
        next.setHours(
          Number.isFinite(hours) ? hours : 9,
          Number.isFinite(minutes) ? minutes : 0,
          0,
          0,
        );
        onChange(formatDatetimeLocalValue(next));
        return;
      }
      onChange(formatIsoDateValue(date));
      setOpen(false);
    },
    [mode, onChange, timeValue],
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleTimeChange = useCallback(
    (nextTime: string) => {
      setTimeValue(nextTime);
      if (!parsed) return;
      const [hourPart, minutePart] = nextTime.split(':');
      const hours = Number(hourPart ?? 9);
      const minutes = Number(minutePart ?? 0);
      const next = new Date(parsed);
      next.setHours(
        Number.isFinite(hours) ? hours : 9,
        Number.isFinite(minutes) ? minutes : 0,
        0,
        0,
      );
      onChange(formatDatetimeLocalValue(next));
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
        <div className={cn('min-w-0 flex-1', variant === 'extended' && 'pr-1')}>
          <NbosCalendarGrid
            viewMonth={viewMonth}
            selectedDate={parsed}
            locale={locale}
            onViewMonthChange={setViewMonth}
            onSelectDate={applyDate}
          />
          {mode === 'datetime' ? (
            <div className="border-border/50 mt-3 border-t pt-3">
              <NbosTimePicker value={timeValue} onChange={handleTimeChange} />
            </div>
          ) : null}
          <PickerFooter
            onClear={handleClear}
            onToday={() => applyDate(new Date())}
            showToday={mode === 'date'}
          />
        </div>
        {variant === 'extended' ? (
          <NbosDatePresetsPanel
            anchorDate={anchor}
            selectedDate={parsed}
            locale={locale}
            onSelectPreset={(date) => {
              setViewMonth(date);
              applyDate(date);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function PickerFooter({
  onClear,
  onToday,
  showToday,
}: {
  onClear: () => void;
  onToday: () => void;
  showToday: boolean;
}) {
  return (
    <div className="border-border/50 mt-3 flex items-center justify-between gap-2 border-t pt-2">
      <button
        type="button"
        onClick={onClear}
        className="text-primary hover:text-primary/80 text-sm font-medium"
      >
        Clear
      </button>
      {showToday ? (
        <button
          type="button"
          onClick={onToday}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}
