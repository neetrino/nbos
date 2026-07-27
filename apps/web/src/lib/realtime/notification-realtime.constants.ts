export const NOTIFICATION_SSE_PATH = '/api/realtime/notifications';

export const NOTIFICATION_SSE_EVENTS = {
  UNREAD_CHANGED: 'notifications.unread.changed',
  LIST_INVALIDATE: 'notifications.list.invalidate',
} as const;

/** Wait before enabling fallback polling after SSE disconnect. */
export const NOTIFICATION_SSE_FALLBACK_GRACE_MS = 60_000;

/** Fallback poll intervals (capped at 5 minutes). */
export const NOTIFICATION_FALLBACK_INTERVALS_MS = [60_000, 120_000, 300_000] as const;

export const NOTIFICATION_FALLBACK_MAX_MS = 300_000;

export const NOTIFICATION_REFETCH_DEBOUNCE_MS = 200;

export const NOTIFICATION_LIST_PAGE_SIZE = 20;

export type NotificationRefetchKey = 'notifications/unread' | 'notifications/list';
