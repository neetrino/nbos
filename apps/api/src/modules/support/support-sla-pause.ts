/** Waiting overlay drives SLA clock pause (NBOS Support canon §6). */

export function isWaitingOverlayPause(waitingState: string): boolean {
  return waitingState !== 'NONE';
}

export interface SupportTicketPauseSnapshot {
  waitingState: string;
  slaPausedTotalSeconds: number;
  slaPauseStartedAt: Date | null;
}

export function buildPauseFieldsAfterWaitingChange(
  before: SupportTicketPauseSnapshot,
  nextWaitingState: string,
  now: Date,
): { slaPausedTotalSeconds: number; slaPauseStartedAt: Date | null } {
  const wasPaused = isWaitingOverlayPause(before.waitingState);
  const willPause = isWaitingOverlayPause(nextWaitingState);
  const nowMs = now.getTime();

  if (wasPaused && !willPause) {
    const started = before.slaPauseStartedAt;
    const deltaSec =
      started !== null ? Math.max(0, Math.floor((nowMs - started.getTime()) / 1000)) : 0;
    return {
      slaPausedTotalSeconds: before.slaPausedTotalSeconds + deltaSec,
      slaPauseStartedAt: null,
    };
  }

  if (!wasPaused && willPause) {
    return {
      slaPausedTotalSeconds: before.slaPausedTotalSeconds,
      slaPauseStartedAt: now,
    };
  }

  if (wasPaused && willPause) {
    return {
      slaPausedTotalSeconds: before.slaPausedTotalSeconds,
      slaPauseStartedAt: before.slaPauseStartedAt ?? now,
    };
  }

  return {
    slaPausedTotalSeconds: before.slaPausedTotalSeconds,
    slaPauseStartedAt: before.slaPauseStartedAt,
  };
}

/** Clears overlay pause accounting when SLA windows reset (e.g. priority change). */
export function resetPauseForSlaRecalculation(
  waitingState: string,
  now: Date,
): { slaPausedTotalSeconds: number; slaPauseStartedAt: Date | null } {
  return {
    slaPausedTotalSeconds: 0,
    slaPauseStartedAt: isWaitingOverlayPause(waitingState) ? now : null,
  };
}
