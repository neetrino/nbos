import {
  CALL_SSE_EVENTS,
  CALL_SSE_PATH,
  CALL_SSE_RECONNECT_BASE_MS,
  CALL_SSE_RECONNECT_MAX_MS,
} from './call-realtime.constants';
import {
  parseActiveCallSsePayload,
  type ActiveCallSsePayload,
} from '@/features/crm/calls/active-call.types';
import { recoverRealtimeSession } from '@/lib/auth/realtime-session';

export type CallSseStatus = 'connecting' | 'connected' | 'disconnected';

type CallSseHandlers = {
  onStatus?: (status: CallSseStatus) => void;
  onCallEvent: (payload: ActiveCallSsePayload) => void;
};

/**
 * Browser EventSource client for active-call SSE (same-origin BFF path).
 * Live events only — reconnect does not replay missed screens.
 */
export function connectCallSse(handlers: CallSseHandlers): { close: () => void } {
  let closed = false;
  let source: EventSource | null = null;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    clearReconnectTimer();
    const delay = Math.min(
      CALL_SSE_RECONNECT_BASE_MS * 2 ** reconnectAttempt,
      CALL_SSE_RECONNECT_MAX_MS,
    );
    reconnectAttempt += 1;
    handlers.onStatus?.('disconnected');
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  };

  const onFrame = (event: Event) => {
    const payload = parseActiveCallSsePayload((event as MessageEvent).data);
    if (payload) handlers.onCallEvent(payload);
  };

  const connect = () => {
    if (closed) return;
    handlers.onStatus?.('connecting');
    source?.close();
    source = new EventSource(CALL_SSE_PATH);

    source.addEventListener('open', () => {
      reconnectAttempt = 0;
      handlers.onStatus?.('connected');
    });
    source.addEventListener(CALL_SSE_EVENTS.STARTED, onFrame);
    source.addEventListener(CALL_SSE_EVENTS.ANSWERED, onFrame);
    source.addEventListener(CALL_SSE_EVENTS.FINISHED, onFrame);

    source.onerror = () => {
      if (closed) return;
      source?.close();
      source = null;
      void recoverRealtimeSession().then((result) => {
        if (closed) return;
        if (result.kind === 'session-invalid') {
          closed = true;
          handlers.onStatus?.('disconnected');
          return;
        }
        scheduleReconnect();
      });
    };
  };

  connect();

  return {
    close: () => {
      closed = true;
      clearReconnectTimer();
      source?.close();
      source = null;
      handlers.onStatus?.('disconnected');
    },
  };
}
