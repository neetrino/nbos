export const CALL_SSE_PATH = '/api/realtime/calls';

export const CALL_SSE_EVENTS = {
  INCOMING_CALL: 'incoming_call',
} as const;

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export const CALL_SSE_RECONNECT_BASE_MS = RECONNECT_BASE_MS;
export const CALL_SSE_RECONNECT_MAX_MS = RECONNECT_MAX_MS;
