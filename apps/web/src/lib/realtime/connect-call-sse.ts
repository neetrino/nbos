import {
  CALL_SSE_EVENTS,
  CALL_SSE_PATH,
  CALL_SSE_RECONNECT_BASE_MS,
  CALL_SSE_RECONNECT_MAX_MS,
} from './call-realtime.constants';
import {
  parseIncomingCallPayload,
  type IncomingCallPayload,
} from '@/features/crm/calls/incoming-call.types';

export type CallSseStatus = 'connecting' | 'connected' | 'disconnected';

type CallSseHandlers = {
  onStatus?: (status: CallSseStatus) => void;
  onIncomingCall: (payload: IncomingCallPayload) => void;
};

/**
 * Browser EventSource client for incoming-call SSE (same-origin BFF path).
 * Live events only — reconnect does not replay missed popups.
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

  const connect = () => {
    if (closed) return;
    handlers.onStatus?.('connecting');
    source?.close();
    source = new EventSource(CALL_SSE_PATH);

    source.addEventListener('open', () => {
      reconnectAttempt = 0;
      handlers.onStatus?.('connected');
    });

    source.addEventListener(CALL_SSE_EVENTS.INCOMING_CALL, (event) => {
      const payload = parseIncomingCallPayload((event as MessageEvent).data);
      if (payload) handlers.onIncomingCall(payload);
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
      handlers.onStatus?.('disconnected');
    },
  };
}
