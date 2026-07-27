import type { NotificationSseEventName } from './notification-realtime.constants';

/** Versioned minimal payload pushed over SSE (no private notification body). */
export interface NotificationUnreadChangedPayload {
  schemaVersion: 1;
  employeeId: string;
  unreadCount: number;
  version: number;
  occurredAt: string;
  /** When true, open dropdowns should silent-refetch the list. */
  invalidateList: boolean;
}

export interface NotificationRealtimeBusMessage {
  event: NotificationSseEventName;
  payload: NotificationUnreadChangedPayload;
}

export interface SseOutboundFrame {
  event: string;
  id: string;
  data: string;
}
