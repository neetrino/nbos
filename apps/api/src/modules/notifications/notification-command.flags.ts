function parseFlag(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Optimized createOne/createMany command path. */
export function isNotificationCommandV2Enabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.NOTIFICATION_COMMAND_V2_ENABLED);
}

/** Batch createMany + set-based inbox for multi-recipient. */
export function isNotificationBulkWriteEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.NOTIFICATION_BULK_WRITE_ENABLED);
}

/** Publish SSE from InboxState snapshot (no post-mutation COUNT). */
export function isNotificationSseFromInboxStateEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseFlag(env.NOTIFICATION_SSE_FROM_INBOX_STATE_ENABLED);
}

/** Recover PENDING NotificationDelivery / jobs via scheduler reconcile. */
export function isNotificationEnqueueReconcileEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseFlag(env.NOTIFICATION_ENQUEUE_RECONCILE_ENABLED);
}

const DEFAULT_BATCH = 200;
const DEFAULT_CONCURRENCY = 4;
const MIN = 1;
const MAX_BATCH = 2000;
const MAX_CONCURRENCY = 32;

export function resolveNotificationBatchSize(env: NodeJS.ProcessEnv = process.env): number {
  return parseBoundedInt(
    env.NOTIFICATION_BATCH_SIZE,
    DEFAULT_BATCH,
    'NOTIFICATION_BATCH_SIZE',
    MAX_BATCH,
  );
}

export function resolveNotificationBatchConcurrency(env: NodeJS.ProcessEnv = process.env): number {
  return parseBoundedInt(
    env.NOTIFICATION_BATCH_CONCURRENCY,
    DEFAULT_CONCURRENCY,
    'NOTIFICATION_BATCH_CONCURRENCY',
    MAX_CONCURRENCY,
  );
}

function parseBoundedInt(
  raw: string | undefined,
  fallback: number,
  key: string,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`Invalid ${key}="${raw}"`);
  }
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < MIN || n > max) {
    throw new Error(`Invalid ${key}=${n}: must be ${MIN}..${max}`);
  }
  return n;
}
