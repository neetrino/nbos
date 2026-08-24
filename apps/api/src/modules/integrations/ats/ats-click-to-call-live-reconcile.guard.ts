import {
  ATS_CALL_SOURCE_CLICK_TO_CALL,
  ATS_CLICK_TO_CALL_HISTORY_SYNC_COOLDOWN_MS,
  ATS_CLICK_TO_CALL_HISTORY_SYNC_MIN_AGE_MS,
} from './ats.constants';
import { isAtsTerminalState } from './ats-call-realtime.phase';

export function shouldSyncClickToCallFromHistory(input: {
  source: string | null;
  state: string | null;
  createdAt: Date;
  now?: Date;
  lastAttemptAt?: number;
}): boolean {
  if (input.source !== ATS_CALL_SOURCE_CLICK_TO_CALL) return false;
  if (isAtsTerminalState(input.state)) return false;
  const now = input.now ?? new Date();
  if (now.getTime() - input.createdAt.getTime() < ATS_CLICK_TO_CALL_HISTORY_SYNC_MIN_AGE_MS) {
    return false;
  }
  if (
    input.lastAttemptAt != null &&
    now.getTime() - input.lastAttemptAt < ATS_CLICK_TO_CALL_HISTORY_SYNC_COOLDOWN_MS
  ) {
    return false;
  }
  return true;
}
