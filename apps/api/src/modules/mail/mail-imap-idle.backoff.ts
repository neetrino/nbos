import {
  MAIL_IDLE_BACKOFF_JITTER_RATIO,
  MAIL_IDLE_BACKOFF_STEPS_MS,
} from './mail-sync-runtime.constants';

/** 5s → 15s → 30s → cap 120s, plus ±20% jitter. */
export function nextIdleBackoffMs(attempt: number, random: () => number = Math.random): number {
  const index = Math.min(Math.max(attempt, 0), MAIL_IDLE_BACKOFF_STEPS_MS.length - 1);
  const base = MAIL_IDLE_BACKOFF_STEPS_MS[index];
  const jitter = 1 + (random() * 2 - 1) * MAIL_IDLE_BACKOFF_JITTER_RATIO;
  return Math.max(1, Math.round(base * jitter));
}
