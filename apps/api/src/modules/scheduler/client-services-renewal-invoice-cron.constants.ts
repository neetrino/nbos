/** When `true` / `1` / `yes`, registers the Client Services renewal invoice cron. */
export const CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED_ENV =
  'SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED';

export const CLIENT_SERVICES_RENEWAL_INVOICE_CRON_ENV =
  'SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_CRON';

/** 06:00 daily — avoids billing (03:00), expense-plan (02:00), overdue (05:00). */
export const CLIENT_SERVICES_RENEWAL_INVOICE_DEFAULT_CRON = '0 6 * * *';
