/** Locale-aware short date + time for task sheet meta rows. */
export function formatTaskSheetDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const includeYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}
