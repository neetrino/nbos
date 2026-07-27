import { NOTIFICATION_SSE_EVENTS, NOTIFICATION_SSE_PATH } from './notification-realtime.constants';

export type NotificationSseStatus = 'connecting' | 'connected' | 'disconnected';

export interface NotificationSsePayload {
  unreadCount: number;
  version: number;
  occurredAt?: string;
  schemaVersion?: number;
}

type SseHandlers = {
  onStatus: (status: NotificationSseStatus) => void;
  onUnreadChanged: (payload: NotificationSsePayload) => void;
  onListInvalidate: (payload: NotificationSsePayload) => void;
  onOpen: (isReconnect: boolean) => void;
};

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

/**
 * Browser EventSource client for notification SSE (same-origin BFF path).
 */
export function connectNotificationSse(handlers: SseHandlers): { close: () => void } {
  let closed = false;
  let source: EventSource | null = null;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let hadConnected = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    clearReconnectTimer();
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
    reconnectAttempt += 1;
    handlers.onStatus('disconnected');
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  };

  const parsePayload = (raw: string): NotificationSsePayload | null => {
    try {
      const data = JSON.parse(raw) as NotificationSsePayload;
      if (typeof data.unreadCount !== 'number' || typeof data.version !== 'number') return null;
      return data;
    } catch {
      return null;
    }
  };

  const connect = () => {
    if (closed) return;
    handlers.onStatus('connecting');
    source?.close();
    source = new EventSource(NOTIFICATION_SSE_PATH);

    source.addEventListener('open', () => {
      reconnectAttempt = 0;
      handlers.onStatus('connected');
      handlers.onOpen(hadConnected);
      hadConnected = true;
    });

    source.addEventListener(NOTIFICATION_SSE_EVENTS.UNREAD_CHANGED, (event) => {
      const payload = parsePayload((event as MessageEvent).data);
      if (payload) handlers.onUnreadChanged(payload);
    });

    source.addEventListener(NOTIFICATION_SSE_EVENTS.LIST_INVALIDATE, (event) => {
      const payload = parsePayload((event as MessageEvent).data);
      if (payload) handlers.onListInvalidate(payload);
    });

    source.onerror = () => {
      if (closed) return;
      source?.close();
      source = null;
      scheduleReconnect();
    };
  };

  connect();

  return {
    close: () => {
      closed = true;
      clearReconnectTimer();
      source?.close();
      source = null;
      handlers.onStatus('disconnected');
    },
  };
}
