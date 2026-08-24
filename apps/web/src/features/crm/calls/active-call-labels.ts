import type { ActiveCallPhase } from './active-call.types';
import type { ActiveCallSession } from './active-call-session';

export function activeCallDirectionLabel(direction: ActiveCallSession['direction'] | null): string {
  if (direction === 'OUTBOUND') return 'Outgoing';
  if (direction === 'INBOUND') return 'Incoming';
  return 'Call';
}

export function activeCallPhaseLabel(phase: ActiveCallPhase): string {
  if (phase === 'answered') return 'Answered';
  if (phase === 'ended') return 'Ended';
  return 'Ringing';
}
