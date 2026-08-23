import { ATS_NO_ANSWER_DISPOSITIONS } from './ats-call-recording.constants';
import { ATS_TERMINAL_STATES } from './ats.constants';
import type { AtsWebhookPayload } from './ats.types';

/**
 * Terminal calls that may have audio. Missed calls without a record link stay
 * without a recording status (UI: "No recording available").
 */
export function shouldEnqueueCallRecording(payload: AtsWebhookPayload): boolean {
  const state = payload.state?.trim().toLowerCase() ?? '';
  if (!ATS_TERMINAL_STATES.has(state)) return false;
  if (payload.recordLink?.trim()) return true;
  const disposition = payload.disposition?.trim().toUpperCase() ?? '';
  if (ATS_NO_ANSWER_DISPOSITIONS.has(disposition)) return false;
  return true;
}
