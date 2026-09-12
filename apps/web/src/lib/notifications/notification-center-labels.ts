export const NOTIFICATION_CATEGORY_FILTERS = [
  { value: undefined, key: 'all' },
  { value: 'informational', key: 'informational' },
  { value: 'action_required', key: 'action_required' },
  { value: 'system_health', key: 'system_health' },
  { value: 'audit_security', key: 'audit_security' },
] as const;

export type NotificationCategoryFilter = (typeof NOTIFICATION_CATEGORY_FILTERS)[number]['value'];
export type NotificationCategoryKey = (typeof NOTIFICATION_CATEGORY_FILTERS)[number]['key'];

const PRIORITY_KEYS = ['critical', 'high', 'medium', 'low', 'normal'] as const;
export type NotificationPriorityKey = (typeof PRIORITY_KEYS)[number];

export function isNotificationCategoryKey(value: string): value is NotificationCategoryKey {
  return NOTIFICATION_CATEGORY_FILTERS.some((item) => item.key === value);
}

export function isNotificationPriorityKey(value: string): value is NotificationPriorityKey {
  return PRIORITY_KEYS.some((key) => key === value);
}

/** Translate a known category; unknown values stay as stored codes. */
export function localizeNotificationCategory(
  category: string,
  t: (key: `category.${NotificationCategoryKey}`) => string,
): string {
  if (!isNotificationCategoryKey(category) || category === 'all') return category;
  return t(`category.${category}`);
}

/** Translate a known priority; unknown values stay as stored codes. */
export function localizeNotificationPriority(
  priority: string,
  t: (key: `priority.${NotificationPriorityKey}`) => string,
): string {
  if (!isNotificationPriorityKey(priority)) return priority;
  return t(`priority.${priority}`);
}

export function formatNotificationCenterDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
