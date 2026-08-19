import { toBullMqSafeJobId } from '@nbos/shared';

/** Logical BullMQ jobId prefix for one outbound send (debounce + idempotency). */
export const MAIL_SEND_JOB_ID_PREFIX = 'mail-send:';

export function mailSendJobId(messageId: string): string {
  return toBullMqSafeJobId(`${MAIL_SEND_JOB_ID_PREFIX}${messageId}`);
}

/** Structured log name when local/dev sends inline because Redis is absent. */
export const MAIL_INLINE_FALLBACK_LOG = 'mail.inline_fallback';

/** Orphan QUEUED older than this is re-enqueued by reconcile. */
export const MAIL_ORPHAN_QUEUED_AGE_MS = 60_000;

/** Stale SENDING without provider id is returned to QUEUED. */
export const MAIL_STALE_SENDING_AGE_MS = 10 * 60 * 1000;

export const MAIL_OUTBOUND_RECONCILE_BATCH_SIZE = 50;

export const MAIL_OUTBOUND_RECONCILE_ENABLED_ENV = 'SCHEDULER_MAIL_OUTBOUND_RECONCILE_ENABLED';
export const MAIL_OUTBOUND_RECONCILE_CRON_ENV = 'SCHEDULER_MAIL_OUTBOUND_RECONCILE_CRON';
export const MAIL_OUTBOUND_RECONCILE_DEFAULT_CRON = '*/2 * * * *';
