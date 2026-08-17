/** When `true` / `1` / `yes` (case-insensitive), registers an in-process cron job. */
export const RECURRING_TASKS_DUE_ENABLED_ENV = 'SCHEDULER_RECURRING_TASKS_DUE_ENABLED';

/**
 * Standard five-field cron expression (server timezone unless `TZ` is set).
 * If enabled and unset, {@link RECURRING_TASKS_DUE_DEFAULT_CRON} is used and logged once.
 */
export const RECURRING_TASKS_DUE_CRON_ENV = 'SCHEDULER_RECURRING_TASKS_DUE_CRON';

/** Every 5 minutes — recurring templates can fire at a specific time of day. */
export const RECURRING_TASKS_DUE_DEFAULT_CRON = '*/5 * * * *';
