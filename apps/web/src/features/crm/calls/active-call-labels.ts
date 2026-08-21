import type { ActiveCallPhase } from './active-call.types';
import type { ActiveCallSession } from './active-call-session';

export function activeCallDirectionLabel(direction: ActiveCallSession['direction']): string {
  return direction === 'OUTBOUND' ? 'OUT' : 'IN';
}

export function activeCallPhaseLabel(phase: ActiveCallPhase): string {
  if (phase === 'answered') return 'answered';
  if (phase === 'ended') return 'ended';
  return 'ringing';
}
