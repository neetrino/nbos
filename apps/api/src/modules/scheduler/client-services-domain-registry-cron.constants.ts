/** When `true` / `1` / `yes`, registers the Client Services domain registry cron. */
export const CLIENT_SERVICES_DOMAIN_REGISTRY_ENABLED_ENV =
  'SCHEDULER_CLIENT_SERVICES_DOMAIN_REGISTRY_ENABLED';

export const CLIENT_SERVICES_DOMAIN_REGISTRY_CRON_ENV =
  'SCHEDULER_CLIENT_SERVICES_DOMAIN_REGISTRY_CRON';

/** 05:45 daily — runs before EXP-04 invoices at 06:00. */
export const CLIENT_SERVICES_DOMAIN_REGISTRY_DEFAULT_CRON = '45 5 * * *';
