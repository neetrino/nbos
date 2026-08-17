import { RECURRING_WEEKDAYS } from './recurring-task-constants';

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatRecurringDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME.format(date);
}

export function formatRecurringDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_ONLY.format(date);
}

export function formatRecurringSchedule(input: {
  frequency: string;
  interval: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  startDate: string;
}): string {
  const time = formatTimeOfDay(input.startDate);
  const every = input.interval > 1 ? `Every ${input.interval} ` : '';

  if (input.frequency === 'DAILY') {
    return input.interval > 1 ? `${every}days at ${time}` : `Every day at ${time}`;
  }
  if (input.frequency === 'WEEKLY') {
    const days = formatWeekdays(input.daysOfWeek);
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

function formatWeekdays(daysOfWeek: string[]): string {
  const labels = RECURRING_WEEKDAYS.filter((day) => daysOfWeek.includes(day.value)).map(
    (day) => day.label,
  );
  return labels.join(', ');
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
