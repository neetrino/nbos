/** Trashed credentials older than this are eligible for scheduled hard purge. */
export const CREDENTIAL_TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Max credentials purged per scheduler tick. */
export const CREDENTIAL_TRASH_PURGE_BATCH_CAP = 100;

export const CREDENTIAL_TRASH_PURGE_CRON_ENV = 'SCHEDULER_CREDENTIAL_TRASH_PURGE_CRON';
export const CREDENTIAL_TRASH_PURGE_DEFAULT_CRON = '15 3 * * *';
export const CREDENTIAL_TRASH_PURGE_ENABLED_ENV = 'SCHEDULER_CREDENTIAL_TRASH_PURGE_ENABLED';
export const CREDENTIAL_TRASH_PURGE_JOB_NAME = 'credential-trash-purge';
