/** SSE heartbeat interval (comment frames). */
export const NOTIFICATION_SSE_HEARTBEAT_MS = 25_000;

/** Redis Pub/Sub channel for notification realtime fan-out. */
export const NOTIFICATION_REALTIME_CHANNEL = 'nbos:realtime:notifications';

export const NOTIFICATION_SSE_EVENT = {
  UNREAD_CHANGED: 'notifications.unread.changed',
  LIST_INVALIDATE: 'notifications.list.invalidate',
} as const;

export type NotificationSseEventName =
  (typeof NOTIFICATION_SSE_EVENT)[keyof typeof NOTIFICATION_SSE_EVENT];
