export const PLATFORM_TRASH_PURGE_AUDIT_ENTITY = 'PlatformLifecycle';
export const PLATFORM_TRASH_PURGE_AUDIT_ACTION = 'platform.trash_retention_purge_run';

/** Sentinel actor for scheduled retention purge audit rows (no interactive user). */
export const PLATFORM_SCHEDULER_AUDIT_ACTOR_ID = '00000000-0000-4000-8000-000000000000';

export const PLATFORM_TRASH_PURGE_CRON_ENV = 'SCHEDULER_PLATFORM_TRASH_PURGE_CRON';
export const PLATFORM_TRASH_PURGE_DEFAULT_CRON = '30 3 * * *';
export const PLATFORM_TRASH_PURGE_ENABLED_ENV = 'SCHEDULER_PLATFORM_TRASH_PURGE_ENABLED';
export const PLATFORM_TRASH_PURGE_JOB_NAME = 'platform-trash-purge';
