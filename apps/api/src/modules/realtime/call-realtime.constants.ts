/** SSE heartbeat interval (comment frames). */
export const CALL_SSE_HEARTBEAT_MS = 25_000;

/** Redis Pub/Sub channel for incoming-call fan-out. */
export const CALL_REALTIME_CHANNEL = 'nbos:realtime:calls';

export const CALL_SSE_EVENT = {
  INCOMING_CALL: 'incoming_call',
} as const;

export type CallSseEventName = (typeof CALL_SSE_EVENT)[keyof typeof CALL_SSE_EVENT];
