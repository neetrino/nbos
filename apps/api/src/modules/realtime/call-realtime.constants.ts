export const CALL_SSE_HEARTBEAT_MS = 25_000;

/** Redis Pub/Sub channel for active-call fan-out. */
export const CALL_REALTIME_CHANNEL = 'nbos:realtime:calls';

export const CALL_SSE_EVENT = {
  STARTED: 'call.started',
  ANSWERED: 'call.answered',
  FINISHED: 'call.finished',
} as const;

export type CallSseEventName = (typeof CALL_SSE_EVENT)[keyof typeof CALL_SSE_EVENT];

export const CALL_LIFECYCLE_SSE_EVENTS = [
  CALL_SSE_EVENT.STARTED,
  CALL_SSE_EVENT.ANSWERED,
  CALL_SSE_EVENT.FINISHED,
] as const;

export type CallLifecycleSseEventName = (typeof CALL_LIFECYCLE_SSE_EVENTS)[number];

export function isCallLifecycleSseEvent(event: string): event is CallLifecycleSseEventName {
  return (CALL_LIFECYCLE_SSE_EVENTS as readonly string[]).includes(event);
}
