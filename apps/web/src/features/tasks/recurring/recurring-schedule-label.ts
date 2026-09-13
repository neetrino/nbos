import { RECURRING_WEEKDAYS } from './recurring-task-constants';

const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
export type RecurringWeekdayCode = (typeof WEEKDAY_CODES)[number];

export type RecurringScheduleTranslator = (
  key:
    | `recurring.schedule.${
        | 'everyDay'
        | 'everyNDays'
        | 'weekly'
        | 'everyNWeeks'
        | 'monthly'
        | 'everyNMonths'
        | 'yearly'
        | 'everyNYears'
        | 'onDaysAt'
        | 'atTime'
        | 'onDayAt'}`
    | `recurring.weekday.${RecurringWeekdayCode}`,
  values?: Record<string, string | number>,
) => string;

function isWeekdayCode(value: string): value is RecurringWeekdayCode {
  return WEEKDAY_CODES.some((code) => code === value);
}

export function formatRecurringDateTime(iso: string | null | undefined, locale = 'en-GB'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRecurringDate(iso: string | null | undefined, locale = 'en-GB'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRecurringSchedule(
  input: {
    frequency: string;
    interval: number;
    daysOfWeek: string[];
    dayOfMonth: number | null;
    startDate: string;
  },
  t?: RecurringScheduleTranslator,
): string {
  const time = formatTimeOfDay(input.startDate);
  const days = formatWeekdays(input.daysOfWeek, t);
  if (t) return formatLocalizedSchedule(input, time, days, t);
  return formatEnglishSchedule(input, time, days);
}

function formatEnglishSchedule(
  input: {
    frequency: string;
    interval: number;
    daysOfWeek: string[];
    dayOfMonth: number | null;
  },
  time: string,
  days: string,
): string {
  const every = input.interval > 1 ? `Every ${input.interval} ` : '';
  if (input.frequency === 'DAILY') {
    return input.interval > 1 ? `${every}days at ${time}` : `Every day at ${time}`;
  }
  if (input.frequency === 'WEEKLY') {
    const cadence = input.interval > 1 ? `${every}weeks` : 'Weekly';
    return days ? `${cadence} on ${days} at ${time}` : `${cadence} at ${time}`;
  }
  if (input.frequency === 'MONTHLY') {
    const day = input.dayOfMonth ? ` on the ${ordinal(input.dayOfMonth)}` : '';
    const cadence = input.interval > 1 ? `${every}months` : 'Monthly';
    return `${cadence}${day} at ${time}`;
  }
  if (input.frequency === 'YEARLY') {
    const cadence = input.interval > 1 ? `${every}years` : 'Yearly';
    return `${cadence} at ${time}`;
  }
  return `${input.frequency} at ${time}`;
}

function formatLocalizedSchedule(
  input: {
    frequency: string;
    interval: number;
    dayOfMonth: number | null;
  },
  time: string,
  days: string,
  t: RecurringScheduleTranslator,
): string {
  if (input.frequency === 'DAILY') {
    return input.interval > 1
      ? t('recurring.schedule.everyNDays', { n: input.interval, time })
      : t('recurring.schedule.everyDay', { time });
  }
  if (input.frequency === 'WEEKLY') {
    const cadence =
      input.interval > 1
        ? t('recurring.schedule.everyNWeeks', { n: input.interval })
        : t('recurring.schedule.weekly');
    return days
      ? t('recurring.schedule.onDaysAt', { cadence, days, time })
      : t('recurring.schedule.atTime', { cadence, time });
  }
  if (input.frequency === 'MONTHLY') {
    const cadence =
      input.interval > 1
        ? t('recurring.schedule.everyNMonths', { n: input.interval })
        : t('recurring.schedule.monthly');
    return input.dayOfMonth
      ? t('recurring.schedule.onDayAt', { cadence, day: input.dayOfMonth, time })
      : t('recurring.schedule.atTime', { cadence, time });
  }
  if (input.frequency === 'YEARLY') {
    const cadence =
      input.interval > 1
        ? t('recurring.schedule.everyNYears', { n: input.interval })
        : t('recurring.schedule.yearly');
    return t('recurring.schedule.atTime', { cadence, time });
  }
  return t('recurring.schedule.atTime', { cadence: input.frequency, time });
}

function formatWeekdays(daysOfWeek: string[], t?: RecurringScheduleTranslator): string {
  return RECURRING_WEEKDAYS.filter((day) => daysOfWeek.includes(day.value))
    .map((day) => (t && isWeekdayCode(day.value) ? t(`recurring.weekday.${day.value}`) : day.label))
    .join(', ');
}

function formatTimeOfDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '09:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function ordinal(value: number): string {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}
