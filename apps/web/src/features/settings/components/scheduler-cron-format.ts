const CRON_FIELD_LABELS = ['minute', 'hour', 'day of month', 'month', 'day of week'] as const;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export type CronFields = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export function parseCronExpression(expression: string | null | undefined): CronFields | null {
  if (!expression) return null;
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0] ?? '*',
    hour: parts[1] ?? '*',
    dayOfMonth: parts[2] ?? '*',
    month: parts[3] ?? '*',
    dayOfWeek: parts[4] ?? '*',
  };
}

export function cronFieldsList(fields: CronFields): string[] {
  return [fields.minute, fields.hour, fields.dayOfMonth, fields.month, fields.dayOfWeek];
}

export function cronFieldLabels(): readonly string[] {
  return CRON_FIELD_LABELS;
}

/** One-line human summary for common 5-field expressions. */
export function describeCronExpression(expression: string | null | undefined): string {
  const fields = parseCronExpression(expression);
  if (!fields) {
    if (!expression || expression.trim().length === 0) return 'No schedule';
    return expression.trim();
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;

  const everyMinutes = minute.match(/^\*\/(\d+)$/);
  if (everyMinutes && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Every ${everyMinutes[1]} minutes`;
  }

  if (
    minute === '0' &&
    hour.match(/^\d+$/) &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return `Every day at ${padTime(hour, '0')}`;
  }

  if (
    minute.match(/^\d+$/) &&
    hour.match(/^\d+$/) &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return `Every day at ${padTime(hour, minute)}`;
  }

  if (
    minute.match(/^\d+$/) &&
    hour.match(/^\d+$/) &&
    dayOfMonth === '1' &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return `1st of every month at ${padTime(hour, minute)}`;
  }

  if (
    minute.match(/^\d+$/) &&
    hour.match(/^\d+$/) &&
    dayOfMonth.match(/^\d+$/) &&
    month === '*' &&
    dayOfWeek === '*'
  ) {
    return `Day ${dayOfMonth} of every month at ${padTime(hour, minute)}`;
  }

  if (
    minute.match(/^\d+$/) &&
    hour.match(/^\d+$/) &&
    dayOfMonth === '*' &&
    month === '*' &&
    dayOfWeek.match(/^[0-6]$/)
  ) {
    const name = WEEKDAY_NAMES[Number(dayOfWeek)] ?? `weekday ${dayOfWeek}`;
    return `Every ${name} at ${padTime(hour, minute)}`;
  }

  return `Cron ${expression?.trim() ?? ''}`;
}

function padTime(hour: string, minute: string): string {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

export function formatSchedulerWhen(iso: string | null, timezone?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      timeZone: timezone && timezone.trim().length > 0 ? timezone : undefined,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}
