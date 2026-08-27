'use client';

import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NbosDatePickerMainColumn } from '@/components/shared/date-picker/nbos-date-picker-main-column';
import { NBOS_DATE_PICKER_DEFAULT_LOCALE } from '@/components/shared/date-picker/date-picker-constants';
import {
  formatDatetimeLocalValue,
  parseDatetimeLocalValue,
} from '@/components/shared/date-picker/date-picker-format';
import { useDatePickerTypedDraft } from '@/components/shared/date-picker/use-date-picker-typed-draft';
import { formatTaskDueDatePickerValue } from '@/features/tasks/task-general-form-state';
import { cn } from '@/lib/utils';
import {
  formatTaskCardDate,
  TASK_CARD_DUE_BADGE_CLASS,
  TASK_CARD_DUE_BADGE_TONE_CLASS,
} from './task-mini-card-meta';

function commitDatetimeValue(date: Date, timeValue: string): string {
  const [hourPart, minutePart] = timeValue.split(':');
  const hours = Number(hourPart ?? 19);
  const minutes = Number(minutePart ?? 0);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 19, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return formatDatetimeLocalValue(next);
}

export function TaskCardDueDatePicker({
  dueDate,
  isOverdue,
  onChange,
}: {
  dueDate: string;
  isOverdue: boolean;
  onChange: (dueDate: string) => void | Promise<void>;
}) {
  const pickerValue = formatTaskDueDatePickerValue(dueDate);
  const parsed = useMemo(() => parseDatetimeLocalValue(pickerValue), [pickerValue]);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parsed ?? new Date());
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined);
  const [timeValue, setTimeValue] = useState(() => (parsed ? format(parsed, 'HH:mm') : '19:00'));
  const { typedDraft, resetTypedDraft, handlePartChange, commitTypedDraft } =
    useDatePickerTypedDraft();

  const applyDate = useCallback(
    (date: Date, closeAfter = false, syncTyped = true) => {
      setDraftDate(date);
      setViewMonth(date);
      if (syncTyped) resetTypedDraft(date);
      void Promise.resolve(onChange(commitDatetimeValue(date, timeValue)));
      if (closeAfter) setOpen(false);
    },
    [onChange, resetTypedDraft, timeValue],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setDraftDate(undefined);
        return;
      }
      setViewMonth(parsed ?? new Date());
      setDraftDate(undefined);
      resetTypedDraft(undefined);
      if (parsed) setTimeValue(format(parsed, 'HH:mm'));
    },
    [parsed, resetTypedDraft],
  );

  const handleTimeChange = useCallback(
    (nextTime: string) => {
      setTimeValue(nextTime);
      if (!draftDate) return;
      void Promise.resolve(onChange(commitDatetimeValue(draftDate, nextTime)));
    },
    [draftDate, onChange],
  );

  const handleClear = useCallback(() => {
    void Promise.resolve(onChange(''));
    setOpen(false);
  }, [onChange]);

  const stopCardClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        className={cn(
          TASK_CARD_DUE_BADGE_CLASS,
          'mt-2 w-fit cursor-pointer bg-transparent shadow-none transition-opacity hover:opacity-90',
          isOverdue
            ? TASK_CARD_DUE_BADGE_TONE_CLASS.overdue
            : TASK_CARD_DUE_BADGE_TONE_CLASS.default,
        )}
        aria-label={`Due ${formatTaskCardDate(dueDate)}. Click to change.`}
        onClick={stopCardClick}
        onPointerDown={stopCardClick}
      >
        {formatTaskCardDate(dueDate)}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="flex w-[17.5rem] min-w-[17.5rem] flex-col gap-0 rounded-2xl p-4 shadow-xl"
        onClick={stopCardClick}
        onPointerDown={stopCardClick}
      >
        <NbosDatePickerMainColumn
          typedDraft={typedDraft}
          onTypedPartChange={(part, raw) =>
            handlePartChange(part, raw, (date) => applyDate(date, false, false))
          }
          onTypedCommit={() => commitTypedDraft((date) => applyDate(date, true))}
          viewMonth={viewMonth}
          selectedDate={draftDate}
          locale={NBOS_DATE_PICKER_DEFAULT_LOCALE}
          onViewMonthChange={setViewMonth}
          onSelectDate={(date) => applyDate(date, false)}
          mode="datetime"
          timeValue={timeValue}
          onTimeChange={handleTimeChange}
          onClear={handleClear}
          onToday={() => applyDate(new Date(), false)}
          extended={false}
        />
      </PopoverContent>
    </Popover>
  );
}
