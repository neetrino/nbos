import {
  classifyNotificationAge,
  formatNotificationAbsoluteDate,
} from './notification-relative-time';

export interface NotificationInboxTimeMessages {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  yesterday: string;
  daysAgo: (count: number) => string;
}

/** Locale-aware inbox timestamp using catalog relative strings. */
export function formatNotificationInboxTime(
  dateStr: string,
  locale: string,
  messages: NotificationInboxTimeMessages,
): string {
  const kind = classifyNotificationAge(dateStr);
  if (kind.type === 'justNow') return messages.justNow;
  if (kind.type === 'minutes') return messages.minutesAgo(kind.count);
  if (kind.type === 'hours') return messages.hoursAgo(kind.count);
  if (kind.type === 'yesterday') return messages.yesterday;
  if (kind.type === 'days') return messages.daysAgo(kind.count);
  return formatNotificationAbsoluteDate(dateStr, locale);
}
