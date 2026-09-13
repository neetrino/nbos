import type { ActiveCallPhase } from './active-call.types';
import type { ActiveCallSession } from './active-call-session';

export function activeCallDirectionLabelKey(
  direction: ActiveCallSession['direction'] | null,
): string {
  if (direction === 'OUTBOUND') return 'calls.outgoing';
  if (direction === 'INBOUND') return 'calls.incoming';
  return 'calls.call';
}

export function activeCallPhaseLabelKey(phase: ActiveCallPhase): string {
  if (phase === 'answered') return 'calls.phase.answered';
  if (phase === 'ended') return 'calls.phase.ended';
  return 'calls.phase.ringing';
}
