import {
  ATS_CALLDIRECT_INBOUND,
  ATS_STATE_END,
  ATS_STATE_FINISH,
  ATS_STATE_INITIATED,
  ATS_STATE_START,
  ATS_STATE_STATUS,
  ATS_TERMINAL_STATES,
} from './ats.constants';
import {
  CALL_SSE_EVENT,
  type CallLifecycleSseEventName,
} from '../../realtime/call-realtime.constants';
import type { ActiveCallPhase } from '../../realtime/call-realtime.types';
import type { AtsWebhookPayload } from './ats.types';

export function normalizeAtsState(state: string | null | undefined): string {
  return state?.trim().toLowerCase() ?? '';
}

export function isAtsTerminalState(state: string | null | undefined): boolean {
  return ATS_TERMINAL_STATES.has(normalizeAtsState(state));
}

export function mapAtsStateToPhase(state: string | null | undefined): ActiveCallPhase {
  const normalized = normalizeAtsState(state);
  if (normalized === ATS_STATE_STATUS) return 'answered';
  if (isAtsTerminalState(normalized)) return 'ended';
  return 'ringing';
}

/**
 * Finish-only first sight must not open a start window (Calls canon §3).
 */
export function resolveCallLifecycleEvent(
  payload: AtsWebhookPayload,
  isFirstSeen: boolean,
): CallLifecycleSseEventName | null {
  const state = normalizeAtsState(payload.state);
  if (state === ATS_STATE_START || state === ATS_STATE_INITIATED) {
    return CALL_SSE_EVENT.STARTED;
  }
  if (state === ATS_STATE_STATUS) {
    return CALL_SSE_EVENT.ANSWERED;
  }
  if (state === ATS_STATE_FINISH || state === ATS_STATE_END) {
    if (isFirstSeen) return null;
    return CALL_SSE_EVENT.FINISHED;
  }
  return null;
}

export function isInboundPayload(payload: AtsWebhookPayload): boolean {
  return payload.calldirect === ATS_CALLDIRECT_INBOUND;
}
