'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('tasks');
  return (
    <div className="grid gap-4">
      <DetailSheetFieldSegmented
        label={t('recurring.frequencyLabel')}
        value={draft.frequency}
        disabled={disabled}
        options={RECURRING_FREQUENCIES.map((frequency) => ({
          value: frequency.value,
          label: t(`recurring.frequency.${frequency.value}`),
        }))}
        onValueChange={(value) => onPatch({ frequency: value as RecurringFrequency })}
      />

      <div className="grid gap-2">
        <Label htmlFor="recurring-interval">{t('recurring.interval')}</Label>
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
          <Label htmlFor="recurring-day-of-month">{t('recurring.dayOfMonth')}</Label>
          <Input
            id="recurring-day-of-month"
            type="number"
            min={1}
            max={31}
            value={draft.dayOfMonth}
            disabled={disabled}
            placeholder={t('recurring.dayOfMonthPlaceholder')}
            onChange={(event) => onPatch({ dayOfMonth: event.target.value })}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="recurring-start">{t('recurring.startDate')}</Label>
          <NbosDatePicker
            id="recurring-start"
            value={draft.startDate}
            onChange={(startDate) => onPatch({ startDate })}
            disabled={disabled}
            aria-label={t('recurring.startDate')}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('recurring.time')}</Label>
          <NbosTimePicker
            value={draft.timeOfDay}
            onChange={(timeOfDay) => onPatch({ timeOfDay })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="recurring-end">{t('recurring.endDate')}</Label>
          <NbosDatePicker
            id="recurring-end"
            value={draft.endDate}
            onChange={(endDate) => onPatch({ endDate })}
            disabled={disabled}
            clearable
            aria-label={t('recurring.endDate')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="recurring-due-offset">{t('recurring.dueOffset')}</Label>
          <Input
            id="recurring-due-offset"
            type="number"
            min={0}
            value={draft.dueDateOffset}
            disabled={disabled}
            placeholder={t('recurring.optional')}
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
  const t = useTranslations('tasks');
  return (
    <div className="grid gap-2">
      <Label>{t('recurring.daysOfWeek')}</Label>
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
              {t(`recurring.weekday.${day.value}`)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
