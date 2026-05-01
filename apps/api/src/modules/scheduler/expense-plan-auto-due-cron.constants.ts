/** When `true` / `1` / `yes` (case-insensitive), registers an in-process cron job. */
export const EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV = 'SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED';

/**
 * Standard five-field cron expression (server timezone unless `TZ` is set).
 * If enabled and unset, {@link EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON} is used and logged once.
 */
export const EXPENSE_PLAN_AUTO_DUE_CRON_ENV = 'SCHEDULER_EXPENSE_PLAN_AUTO_DUE_CRON';

/** 02:00 daily in the process timezone — align `TZ=UTC` in production for predictable UTC runs. */
export const EXPENSE_PLAN_AUTO_DUE_DEFAULT_CRON = '0 2 * * *';

export const EXPENSE_PLAN_AUTO_DUE_JOB_NAME = 'nbos-expense-plan-auto-due';
