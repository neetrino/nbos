const DEFAULT_CONCURRENCY = {
  mail: 5,
  whatsapp: 3,
  reports: 1,
  driveZip: 1,
  atsCallRecording: 2,
} as const;

const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 32;

export type BullmqQueueConcurrencyKey = keyof typeof DEFAULT_CONCURRENCY;

function parsePositiveInt(raw: string, envKey: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid ${envKey}="${raw}": must be an integer between ${MIN_CONCURRENCY} and ${MAX_CONCURRENCY}.`,
    );
  }
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < MIN_CONCURRENCY || value > MAX_CONCURRENCY) {
    throw new Error(
      `Invalid ${envKey}=${value}: must be between ${MIN_CONCURRENCY} and ${MAX_CONCURRENCY}.`,
    );
  }
  return value;
}

export function resolveBullmqConcurrency(
  key: BullmqQueueConcurrencyKey,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const envKey = {
    mail: 'BULLMQ_MAIL_CONCURRENCY',
    whatsapp: 'BULLMQ_WHATSAPP_CONCURRENCY',
    reports: 'BULLMQ_REPORTS_CONCURRENCY',
    driveZip: 'BULLMQ_DRIVE_ZIP_CONCURRENCY',
    atsCallRecording: 'BULLMQ_ATS_CALL_RECORDING_CONCURRENCY',
  }[key];
  const raw = env[envKey];
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_CONCURRENCY[key];
  }
  return parsePositiveInt(raw, envKey);
}

export function resolveAllBullmqConcurrency(env: NodeJS.ProcessEnv = process.env): {
  mail: number;
  whatsapp: number;
  reports: number;
  driveZip: number;
  atsCallRecording: number;
} {
  return {
    mail: resolveBullmqConcurrency('mail', env),
    whatsapp: resolveBullmqConcurrency('whatsapp', env),
    reports: resolveBullmqConcurrency('reports', env),
    driveZip: resolveBullmqConcurrency('driveZip', env),
    atsCallRecording: resolveBullmqConcurrency('atsCallRecording', env),
  };
}
