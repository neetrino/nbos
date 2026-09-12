/** Locale-aware short date + time for task sheet meta rows. */
export function formatTaskSheetDateTime(value: string, locale?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const includeYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Chat timeline divider: today / yesterday / short date. */
export function formatTaskChatDateLabel(
  timestamp: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
  now = new Date(),
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, now)) return todayLabel;
  if (isSameCalendarDay(date, yesterday)) return yesterdayLabel;
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
