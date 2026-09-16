import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import {
  DELIVERY_REALTIME_SCHEMA_VERSION,
  DELIVERY_SSE_EVENT,
  DELIVERY_SSE_PATH,
  DELIVERY_SSE_RECONNECT_BASE_MS,
  DELIVERY_SSE_RECONNECT_MAX_MS,
} from './delivery-realtime.constants';

export type DeliverySseStatus = 'connecting' | 'connected' | 'disconnected';

export interface DeliveryItemChangedPayload {
  schemaVersion: typeof DELIVERY_REALTIME_SCHEMA_VERSION;
  entityType: 'product' | 'extension';
  entityId: string;
  occurredAt: string;
}

type DeliverySseHandlers = {
  onStatus?: (status: DeliverySseStatus) => void;
  onItemChanged: (payload: DeliveryItemChangedPayload) => void;
};

type DeliverySseSession = {
  closed: boolean;
  source: EventSource | null;
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
};

export function isDeliveryEntityType(value: unknown): value is 'product' | 'extension' {
  return value === 'product' || value === 'extension';
}

export function parseDeliveryItemChangedPayload(raw: string): DeliveryItemChangedPayload | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.schemaVersion !== DELIVERY_REALTIME_SCHEMA_VERSION) return null;
    if (!isDeliveryEntityType(data.entityType)) return null;
    if (typeof data.entityId !== 'string' || data.entityId.length === 0) return null;
    if (typeof data.occurredAt !== 'string' || data.occurredAt.length === 0) return null;
    return {
      schemaVersion: DELIVERY_REALTIME_SCHEMA_VERSION,
      entityType: data.entityType,
      entityId: data.entityId,
      occurredAt: data.occurredAt,
    };
  } catch {
    return null;
  }
}

function clearReconnectTimer(session: DeliverySseSession): void {
  if (session.reconnectTimer === null) return;
  clearTimeout(session.reconnectTimer);
  session.reconnectTimer = null;
}

function scheduleDeliverySseReconnect(
  session: DeliverySseSession,
  handlers: DeliverySseHandlers,
  connect: () => void,
): void {
  if (session.closed) return;
  clearReconnectTimer(session);
  const delay = Math.min(
    DELIVERY_SSE_RECONNECT_BASE_MS * 2 ** session.reconnectAttempt,
    DELIVERY_SSE_RECONNECT_MAX_MS,
  );
  session.reconnectAttempt += 1;
  handlers.onStatus?.('disconnected');
  session.reconnectTimer = setTimeout(connect, delay);
}

function bindDeliverySseSource(
  session: DeliverySseSession,
  handlers: DeliverySseHandlers,
  onTransientError: () => void,
): void {
  const source = session.source;
  if (!source) return;
  source.addEventListener('open', () => {
    session.reconnectAttempt = 0;
    handlers.onStatus?.('connected');
  });
  source.addEventListener(DELIVERY_SSE_EVENT.ITEM_CHANGED, (event) => {
    const payload = parseDeliveryItemChangedPayload((event as MessageEvent).data);
    if (payload) handlers.onItemChanged(payload);
  });
  source.onerror = () => {
    if (session.closed) return;
    source.close();
    session.source = null;
    void recoverRealtimeSession().then((result) => {
      if (session.closed) return;
      if (result.kind === 'session-invalid') {
        session.closed = true;
        handlers.onStatus?.('disconnected');
        return;
      }
      onTransientError();
    });
  };
}

/**
 * Browser EventSource client for delivery-board SSE (same-origin BFF path).
 */
export function connectDeliverySse(handlers: DeliverySseHandlers): { close: () => void } {
  const session: DeliverySseSession = {
    closed: false,
    source: null,
    reconnectAttempt: 0,
    reconnectTimer: null,
  };

  const connect = () => {
    if (session.closed) return;
    handlers.onStatus?.('connecting');
    session.source?.close();
    session.source = new EventSource(DELIVERY_SSE_PATH);
    bindDeliverySseSource(session, handlers, () => {
      scheduleDeliverySseReconnect(session, handlers, connect);
    });
  };

  connect();

  return {
    close: () => {
      session.closed = true;
      clearReconnectTimer(session);
      session.source?.close();
      session.source = null;
      handlers.onStatus?.('disconnected');
    },
  };
}
