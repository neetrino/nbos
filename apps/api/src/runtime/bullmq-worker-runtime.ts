/**
 * BullMQ Worker poll settings. Idle workers long-poll Redis (BZPOPMIN + Lua).
 * Higher drainDelay cuts Upstash command volume; jobs wait up to this many seconds.
 */
export const BULLMQ_DEFAULT_DRAIN_DELAY_SEC = 20;
export const BULLMQ_MIN_DRAIN_DELAY_SEC = 5;
export const BULLMQ_MAX_DRAIN_DELAY_SEC = 60;

/** Stalled-job sweep. Default 30s is chatty on empty queues. */
export const BULLMQ_DEFAULT_STALLED_INTERVAL_MS = 120_000;
export const BULLMQ_MIN_STALLED_INTERVAL_MS = 30_000;
export const BULLMQ_MAX_STALLED_INTERVAL_MS = 600_000;

export type BullmqWorkerRuntimeOptions = {
  drainDelay: number;
  stalledInterval: number;
};

function parseBoundedInt(
  raw: string,
  envKey: string,
  min: number,
  max: number,
): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${envKey}="${raw}": must be an integer between ${min} and ${max}.`);
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${envKey}=${value}: must be between ${min} and ${max}.`);
  }
  return value;
}

/**
 * Shared Worker options so all four queues use the same idle-poll budget.
 * Override with `BULLMQ_DRAIN_DELAY_SEC` / `BULLMQ_STALLED_INTERVAL_MS`.
 */
export function resolveBullmqWorkerRuntimeOptions(
  env: NodeJS.ProcessEnv = process.env,
): BullmqWorkerRuntimeOptions {
  const drainRaw = env.BULLMQ_DRAIN_DELAY_SEC;
  const stalledRaw = env.BULLMQ_STALLED_INTERVAL_MS;
  return {
    drainDelay:
      drainRaw === undefined || drainRaw.trim() === ''
        ? BULLMQ_DEFAULT_DRAIN_DELAY_SEC
        : parseBoundedInt(
            drainRaw,
            'BULLMQ_DRAIN_DELAY_SEC',
            BULLMQ_MIN_DRAIN_DELAY_SEC,
            BULLMQ_MAX_DRAIN_DELAY_SEC,
          ),
    stalledInterval:
      stalledRaw === undefined || stalledRaw.trim() === ''
        ? BULLMQ_DEFAULT_STALLED_INTERVAL_MS
        : parseBoundedInt(
            stalledRaw,
            'BULLMQ_STALLED_INTERVAL_MS',
            BULLMQ_MIN_STALLED_INTERVAL_MS,
            BULLMQ_MAX_STALLED_INTERVAL_MS,
          ),
  };
}
