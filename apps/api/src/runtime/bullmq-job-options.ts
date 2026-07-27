import type { DefaultJobOptions } from 'bullmq';

/** Mail + WhatsApp: higher retry budget, longer fail retention. */
export const BULLMQ_CRITICAL_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { age: 86_400, count: 1000 },
  removeOnFail: { age: 1_209_600, count: 5000 },
};

/** Reports + Drive ZIP: fewer attempts, shorter complete retention. */
export const BULLMQ_EXPORT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10_000 },
  removeOnComplete: { age: 21_600, count: 200 },
  removeOnFail: { age: 604_800, count: 1000 },
};
