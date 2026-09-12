const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_DAYS = 7;

export type NotificationRelativeKind =
  | { type: 'justNow' }
  | { type: 'minutes'; count: number }
  | { type: 'hours'; count: number }
  | { type: 'yesterday' }
  | { type: 'days'; count: number }
  | { type: 'absolute' };

/** Classify inbox age without formatting. Absolute dates stay locale-specific at render. */
export function classifyNotificationAge(
  dateStr: string,
  now = new Date(),
): NotificationRelativeKind {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return { type: 'absolute' };

  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / MINUTE_MS);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return { type: 'justNow' };
  if (diffMin < 60) return { type: 'minutes', count: diffMin };
  if (diffHr < 24) return { type: 'hours', count: diffHr };
  if (diffDay === 1) return { type: 'yesterday' };
  if (diffDay < WEEK_DAYS) return { type: 'days', count: diffDay };
  return { type: 'absolute' };
}

export function formatNotificationAbsoluteDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/** Clock time when the notification arrived, e.g. `14:32`. */
export function formatNotificationInboxClockTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
