'use client';

import { cn } from '@/lib/utils';
import { NbosCalendarGrid } from './nbos-calendar-grid';
import { NbosDateTypedInput } from './nbos-date-typed-input';
import { NbosTimePicker } from './nbos-time-picker';
import type { TypedDatePartKey, TypedDateParts } from './date-picker-typed';

export interface NbosDatePickerMainColumnProps {
  typedDraft: TypedDateParts;
  onTypedPartChange: (part: TypedDatePartKey, raw: string) => boolean;
  onTypedCommit: () => void;
  disabled?: boolean;
  viewMonth: Date;
  selectedDate?: Date;
  locale: string;
  onViewMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  mode: 'date' | 'datetime';
  timeValue: string;
  onTimeChange: (value: string) => void;
  onClear: () => void;
  onToday: () => void;
  extended?: boolean;
  showTypedInput?: boolean;
}

export function NbosDatePickerMainColumn({
  typedDraft,
  onTypedPartChange,
  onTypedCommit,
  disabled = false,
  viewMonth,
  selectedDate,
  locale,
  onViewMonthChange,
  onSelectDate,
  mode,
  timeValue,
  onTimeChange,
  onClear,
  onToday,
  extended = false,
  showTypedInput = true,
}: NbosDatePickerMainColumnProps) {
  return (
    <div className={cn('min-w-0 flex-1', extended && 'pr-1')}>
      {showTypedInput ? (
        <NbosDateTypedInput
          value={typedDraft}
          onPartChange={onTypedPartChange}
          onCommit={onTypedCommit}
          disabled={disabled}
          className="mb-3"
        />
      ) : null}
      <NbosCalendarGrid
        viewMonth={viewMonth}
        selectedDate={selectedDate}
        locale={locale}
        onViewMonthChange={onViewMonthChange}
        onSelectDate={onSelectDate}
      />
      {mode === 'datetime' ? (
        <div className="border-border/50 mt-3 border-t pt-3">
          <NbosTimePicker value={timeValue} onChange={onTimeChange} />
        </div>
      ) : null}
      <PickerFooter onClear={onClear} onToday={onToday} showToday={mode === 'date'} />
    </div>
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
