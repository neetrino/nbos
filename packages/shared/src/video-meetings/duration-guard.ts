/** One continuation checkpoint. The next question is an hour after the last accepted one. */
export const DURATION_GUARD_CHECKPOINT_MS = 60 * 60 * 1000;

/** The continue button appears this long before the checkpoint. */
export const DURATION_GUARD_WARNING_LEAD_MS = 10 * 60 * 1000;

/** The continue button moves to the center of the call for the last part of the warning. */
export const DURATION_GUARD_CENTER_LEAD_MS = 2 * 60 * 1000;

export type DurationGuardPhase = 'quiet' | 'warning' | 'due';

export type DurationGuardSnapshot = {
  phase: DurationGuardPhase;
  checkpointAt: Date;
  warningOpensAt: Date;
  remainingMs: number;
  centered: boolean;
};

/**
 * Clock for the live session. `continuedThrough` is the checkpoint the team already accepted,
 * or null before the first continue. A quiet stretch never skips a checkpoint.
 */
export function durationGuardSnapshot(
  sessionStartedAt: Date,
  continuedThrough: Date | null,
  now: Date,
): DurationGuardSnapshot {
  const checkpointAt = nextDurationCheckpoint(sessionStartedAt, continuedThrough);
  const warningOpensAt = new Date(checkpointAt.getTime() - DURATION_GUARD_WARNING_LEAD_MS);
  const remainingMs = Math.max(0, checkpointAt.getTime() - now.getTime());
  const phase = durationGuardPhase(now, warningOpensAt, checkpointAt);
  const centered =
    phase === 'warning' && checkpointAt.getTime() - now.getTime() <= DURATION_GUARD_CENTER_LEAD_MS;
  return { phase, checkpointAt, warningOpensAt, remainingMs, centered };
}

function nextDurationCheckpoint(sessionStartedAt: Date, continuedThrough: Date | null): Date {
  const origin = sessionStartedAt.getTime();
  if (!continuedThrough) {
    return new Date(origin + DURATION_GUARD_CHECKPOINT_MS);
  }
  const steps = Math.max(
    1,
    Math.round((continuedThrough.getTime() - origin) / DURATION_GUARD_CHECKPOINT_MS),
  );
  return new Date(origin + (steps + 1) * DURATION_GUARD_CHECKPOINT_MS);
}

function durationGuardPhase(
  now: Date,
  warningOpensAt: Date,
  checkpointAt: Date,
): DurationGuardPhase {
  if (now.getTime() >= checkpointAt.getTime()) return 'due';
  if (now.getTime() >= warningOpensAt.getTime()) return 'warning';
  return 'quiet';
}
