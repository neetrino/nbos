export function formatMessengerTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function messengerDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Sidebar stamp: clock today, otherwise the short date label. */
export function formatConversationListStamp(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const label = messengerDateLabel(timestamp);
  return label === 'Today' ? formatMessengerTime(timestamp) : label;
}
