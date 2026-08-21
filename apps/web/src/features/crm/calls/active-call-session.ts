import type { ActiveCallSsePayload } from './active-call.types';

export type ActiveCallSession = {
  callId: string;
  uid: string;
  direction: ActiveCallSsePayload['direction'];
  phase: ActiveCallSsePayload['phase'];
  phone: string | null;
  displayName: string | null;
};

export function applyActiveCallEvent(
  current: ActiveCallSession | null,
  event: ActiveCallSsePayload,
): ActiveCallSession | null {
  if (current?.callId === event.callId) {
    return {
      callId: event.callId,
      uid: event.uid,
      direction: event.direction,
      phase: event.phase,
      phone: event.phone ?? current.phone,
      displayName: event.displayName ?? current.displayName,
    };
  }
  if (current && (current.phase === 'ringing' || current.phase === 'answered')) {
    return current;
  }
  if (event.type === 'call.finished') return current;
  return {
    callId: event.callId,
    uid: event.uid,
    direction: event.direction,
    phase: event.phase,
    phone: event.phone,
    displayName: event.displayName,
  };
}

export function sessionFromCallId(input: {
  callId: string;
  uid: string;
  direction: ActiveCallSession['direction'] | null;
  phone: string | null;
  displayName: string | null;
}): ActiveCallSession {
  return {
    callId: input.callId,
    uid: input.uid,
    direction: input.direction ?? 'OUTBOUND',
    phase: 'ringing',
    phone: input.phone,
    displayName: input.displayName,
  };
}
