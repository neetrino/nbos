/**
 * Feature flags for NotificationInboxState rollout.
 * Defaults keep legacy COUNT(*) as the read path until READ is enabled after reconcile.
 */

function parseFlag(raw: string | undefined): boolean {
  const value = raw?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function parseBoundedInt(
  raw: string | undefined,
  fallback: number,
  key: string,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`Invalid ${key}="${raw}"`);
  }
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Invalid ${key}=${n}: must be ${min}..${max}`);
  }
  return n;
}

function parseSampleRate(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    throw new Error(
      `Invalid NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE="${raw}": must be 0..1`,
    );
  }
  return n;
}

export function isNotificationInboxStateWriteEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseFlag(env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED);
}

export function isNotificationInboxStateReadEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.NOTIFICATION_INBOX_STATE_READ_ENABLED);
}

export function isNotificationInboxStateReconcileEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseFlag(env.NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED);
}

export function isNotificationInboxStateShadowReadEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return parseFlag(env.NOTIFICATION_INBOX_STATE_SHADOW_READ_ENABLED);
}

export function resolveInboxShadowReadSampleRate(env: NodeJS.ProcessEnv = process.env): number {
  return parseSampleRate(env.NOTIFICATION_INBOX_STATE_SHADOW_READ_SAMPLE_RATE, 0.05);
}

export function resolveInboxReadMaxDriftedRows(env: NodeJS.ProcessEnv = process.env): number {
  return parseBoundedInt(
    env.NOTIFICATION_INBOX_READ_MAX_DRIFTED_ROWS,
    0,
    'NOTIFICATION_INBOX_READ_MAX_DRIFTED_ROWS',
    0,
    1_000_000,
  );
}

export function resolveInboxReadMaxMissingRows(env: NodeJS.ProcessEnv = process.env): number {
  return parseBoundedInt(
    env.NOTIFICATION_INBOX_READ_MAX_MISSING_ROWS,
    0,
    'NOTIFICATION_INBOX_READ_MAX_MISSING_ROWS',
    0,
    1_000_000,
  );
}

export function resolveInboxReadMaxAbsoluteDrift(env: NodeJS.ProcessEnv = process.env): number {
  return parseBoundedInt(
    env.NOTIFICATION_INBOX_READ_MAX_ABSOLUTE_DRIFT,
    0,
    'NOTIFICATION_INBOX_READ_MAX_ABSOLUTE_DRIFT',
    0,
    1_000_000,
  );
}
