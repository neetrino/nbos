import { toBullMqSafeJobId } from '@nbos/shared';

/** Logical BullMQ jobId prefix for one mailbox sync (debounce Pub/Sub + IDLE + poll). */
export const MAIL_SYNC_JOB_ID_PREFIX = 'mail-sync:';

export function mailSyncJobId(mailAccountId: string): string {
  return toBullMqSafeJobId(`${MAIL_SYNC_JOB_ID_PREFIX}${mailAccountId}`);
}

export const MAIL_IDLE_LOCK_KEY_PREFIX = 'mail:idle:';
export const MAIL_IDLE_LOCK_TTL_SECONDS = 90;
export const MAIL_IDLE_HEARTBEAT_MS = 30_000;
export const MAIL_IDLE_MAX_SOCKETS = 20;
export const MAIL_IDLE_WATCHDOG_MS = 10 * 60 * 1000;
export const MAIL_IDLE_BACKOFF_STEPS_MS = [5_000, 15_000, 30_000, 120_000] as const;
export const MAIL_IDLE_BACKOFF_JITTER_RATIO = 0.2;

export const MAIL_GMAIL_WATCH_RENEW_HORIZON_MS = 24 * 60 * 60 * 1000;
export const MAIL_GMAIL_WATCH_RENEW_ENABLED_ENV = 'SCHEDULER_MAIL_GMAIL_WATCH_RENEW_ENABLED';
export const MAIL_GMAIL_WATCH_RENEW_CRON_ENV = 'SCHEDULER_MAIL_GMAIL_WATCH_RENEW_CRON';
export const MAIL_GMAIL_WATCH_RENEW_DEFAULT_CRON = '0 * * * *';

export const MAIL_SYNC_RECONCILE_ENABLED_ENV = 'SCHEDULER_MAIL_SYNC_RECONCILE_ENABLED';
export const MAIL_SYNC_RECONCILE_CRON_ENV = 'SCHEDULER_MAIL_SYNC_RECONCILE_CRON';
export const MAIL_SYNC_RECONCILE_DEFAULT_CRON = '*/5 * * * *';

export const MAIL_SYNCABLE_ACCOUNT_STATUSES = ['ACTIVE', 'DEGRADED'] as const;

export function mailIdleLockKey(mailAccountId: string): string {
  return `${MAIL_IDLE_LOCK_KEY_PREFIX}${mailAccountId}`;
}
