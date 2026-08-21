export type ActiveCallPhase = 'ringing' | 'answered' | 'ended';
export type ActiveCallDirection = 'INBOUND' | 'OUTBOUND';
export type ActiveCallSseType = 'call.started' | 'call.answered' | 'call.finished';

export interface ActiveCallSsePayload {
  type: ActiveCallSseType;
  callId: string;
  uid: string;
  direction: ActiveCallDirection;
  phase: ActiveCallPhase;
  phone: string | null;
  displayName: string | null;
}

const SSE_TYPES = new Set<ActiveCallSseType>(['call.started', 'call.answered', 'call.finished']);

export function parseActiveCallSsePayload(raw: string): ActiveCallSsePayload | null {
  try {
    const data = JSON.parse(raw) as Partial<ActiveCallSsePayload>;
    if (!isSseType(data.type)) return null;
    if (typeof data.callId !== 'string' || data.callId.length === 0) return null;
    if (typeof data.uid !== 'string' || data.uid.length === 0) return null;
    if (data.direction !== 'INBOUND' && data.direction !== 'OUTBOUND') return null;
    if (data.phase !== 'ringing' && data.phase !== 'answered' && data.phase !== 'ended') {
      return null;
    }
    return {
      type: data.type,
      callId: data.callId,
      uid: data.uid,
      direction: data.direction,
      phase: data.phase,
      phone: asNullableString(data.phone),
      displayName: asNullableString(data.displayName),
    };
  } catch {
    return null;
  }
}

function isSseType(value: unknown): value is ActiveCallSseType {
  return typeof value === 'string' && SSE_TYPES.has(value as ActiveCallSseType);
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
