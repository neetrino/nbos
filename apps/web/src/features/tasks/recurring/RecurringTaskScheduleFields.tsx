'use client';

import { DetailSheetFieldSegmented, NbosTimePicker } from '@/components/shared';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { RecurringFrequency } from '@/lib/api/recurring-tasks';
import { RECURRING_FREQUENCIES, RECURRING_WEEKDAYS } from './recurring-task-constants';
import type { RecurringTaskFormDraft } from './recurring-task-form-state';

interface RecurringTaskScheduleFieldsProps {
  draft: RecurringTaskFormDraft;
  disabled: boolean;
  onPatch: (patch: Partial<RecurringTaskFormDraft>) => void;
}

export function RecurringTaskScheduleFields({
  draft,
  disabled,
  onPatch,
}: RecurringTaskScheduleFieldsProps) {
  return (
    <div className="grid gap-4">
      <DetailSheetFieldSegmented
        label="Frequency"
        value={draft.frequency}
        disabled={disabled}
        options={RECURRING_FREQUENCIES}
        onValueChange={(value) => onPatch({ frequency: value as RecurringFrequency })}
      />

      <div className="grid gap-2">
        <Label htmlFor="recurring-interval">Every (interval)</Label>
        <Input
          id="recurring-interval"
          type="number"
          min={1}
          value={draft.interval}
          disabled={disabled}
          onChange={(event) => onPatch({ interval: event.target.value })}
        />
      </div>

      {draft.frequency === 'WEEKLY' ? (
        <WeekdayPicker
          value={draft.daysOfWeek}
          disabled={disabled}
          onChange={(daysOfWeek) => onPatch({ daysOfWeek })}
        />
      ) : null}

      {draft.frequency === 'MONTHLY' ? (
        <div className="grid gap-2">
          <Label htmlFor="recurring-day-of-month">Day of month</Label>
          <Input
            id="recurring-day-of-month"
            type="number"
            min={1}
            max={31}
            value={draft.dayOfMonth}
            disabled={disabled}
            placeholder="e.g. 10"
            onChange={(event) => onPatch({ dayOfMonth: event.target.value })}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="recurring-start">Start date</Label>
          <NbosDatePicker
            id="recurring-start"
            value={draft.startDate}
            onChange={(startDate) => onPatch({ startDate })}
            disabled={disabled}
            aria-label="Start date"
          />
        </div>
        <div className="grid gap-2">
          <Label>Time</Label>
          <NbosTimePicker
            value={draft.timeOfDay}
            onChange={(timeOfDay) => onPatch({ timeOfDay })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="recurring-end">End date (optional)</Label>
          <NbosDatePicker
            id="recurring-end"
            value={draft.endDate}
            onChange={(endDate) => onPatch({ endDate })}
            disabled={disabled}
            clearable
            aria-label="End date"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="recurring-due-offset">Due in (days after create)</Label>
          <Input
            id="recurring-due-offset"
            type="number"
            min={0}
            value={draft.dueDateOffset}
            disabled={disabled}
            placeholder="Optional"
            onChange={(event) => onPatch({ dueDateOffset: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function WeekdayPicker({
  value,
  disabled,
  onChange,
}: {
  value: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Days of week</Label>
      <div className="flex flex-wrap gap-1.5">
        {RECURRING_WEEKDAYS.map((day) => {
          const selected = value.includes(day.value);
          return (
            <Button
              key={day.value}
              type="button"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              disabled={disabled}
              aria-pressed={selected}
              className={cn('h-8 px-2.5', selected && 'shadow-none')}
              onClick={() =>
                onChange(
                  selected ? value.filter((code) => code !== day.value) : [...value, day.value],
                )
              }
            >
              {day.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
