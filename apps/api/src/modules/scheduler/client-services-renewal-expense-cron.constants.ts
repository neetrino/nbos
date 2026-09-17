/** When `true` / `1` / `yes`, registers the Client Services renewal expense cron. */
export const CLIENT_SERVICES_RENEWAL_EXPENSE_ENABLED_ENV =
  'SCHEDULER_CLIENT_SERVICES_RENEWAL_EXPENSE_ENABLED';

export const CLIENT_SERVICES_RENEWAL_EXPENSE_CRON_ENV =
  'SCHEDULER_CLIENT_SERVICES_RENEWAL_EXPENSE_CRON';

/** 06:15 daily — after D−60 invoices at 06:00. */
export const CLIENT_SERVICES_RENEWAL_EXPENSE_DEFAULT_CRON = '15 6 * * *';
