import type { CallLifecycleSseEventName, CallSseEventName } from './call-realtime.constants';

export type ActiveCallPhase = 'ringing' | 'answered' | 'ended';
export type ActiveCallDirection = 'INBOUND' | 'OUTBOUND';

/** Lean SSE body. Full CRM context is loaded via GET /crm/calls/:id/screen. */
export interface ActiveCallSsePayload {
  type: CallLifecycleSseEventName;
  callId: string;
  uid: string;
  direction: ActiveCallDirection;
  phase: ActiveCallPhase;
  phone: string | null;
  displayName: string | null;
}

export interface ActiveCallBusMessage {
  event: CallSseEventName;
  payload: ActiveCallSsePayload & { employeeId: string };
}
