import { describe, expect, it } from 'vitest';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';
import {
  listPlatformCronCatalogEntries,
  listRosterOnPlatformCronJobNames,
  SCHEDULER_JOB_CATALOG,
  SCHEDULER_JOB_KIND,
  SCHEDULER_JOB_VISIBILITY,
} from './scheduler-job-catalog';
import { BILLING_CRON_ENABLED_ENV } from './scheduler-internal-cron.constants';
import { EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV } from './expense-plan-auto-due-cron.constants';
import { RECURRING_TASKS_DUE_ENABLED_ENV } from './recurring-tasks-due-cron.constants';
import { CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED_ENV } from './client-services-renewal-invoice-cron.constants';
import { REPORT_SCHEDULES_DUE_ENABLED_ENV } from './report-schedules-due-cron.constants';
import { NOTIFICATION_INBOX_RECONCILE_CRON_ENABLED_ENV } from './notification-inbox-reconcile-cron.constants';
import { NOTIFICATION_ENQUEUE_RECONCILE_CRON_ENABLED_ENV } from './notification-enqueue-reconcile-cron.constants';
import { AUTH_SESSION_CLEANUP_CRON_ENABLED_ENV } from './auth-session-cleanup-cron.constants';
import { PLATFORM_TRASH_PURGE_ENABLED_ENV } from '../platform-lifecycle/platform-trash-purge.constants';
import { MAIL_OUTBOUND_RECONCILE_ENABLED_ENV } from '../mail/mail-outbound-runtime.constants';
import {
  MAIL_GMAIL_WATCH_RENEW_ENABLED_ENV,
  MAIL_SYNC_RECONCILE_ENABLED_ENV,
} from '../mail/mail-sync-runtime.constants';
import {
  OVERDUE_INVOICES_CRON_ENABLED_ENV,
  INVOICE_CARD_REMINDERS_CRON_ENABLED_ENV,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENABLED_ENV,
  SALES_KPI_MONTH_CLOSE_CRON_ENABLED_ENV,
  SUPPORT_SLA_ESCALATION_CRON_ENABLED_ENV,
} from './scheduler-internal-cron.constants';

/** Env keys passed to startSchedulerCronJob across cron providers. */
const START_CRON_ENABLED_ENV_KEYS = [
  BILLING_CRON_ENABLED_ENV,
  OVERDUE_INVOICES_CRON_ENABLED_ENV,
  INVOICE_CARD_REMINDERS_CRON_ENABLED_ENV,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENABLED_ENV,
  SALES_KPI_MONTH_CLOSE_CRON_ENABLED_ENV,
  SUPPORT_SLA_ESCALATION_CRON_ENABLED_ENV,
  EXPENSE_PLAN_AUTO_DUE_ENABLED_ENV,
  RECURRING_TASKS_DUE_ENABLED_ENV,
  CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED_ENV,
  REPORT_SCHEDULES_DUE_ENABLED_ENV,
  NOTIFICATION_INBOX_RECONCILE_CRON_ENABLED_ENV,
  NOTIFICATION_ENQUEUE_RECONCILE_CRON_ENABLED_ENV,
  AUTH_SESSION_CLEANUP_CRON_ENABLED_ENV,
  PLATFORM_TRASH_PURGE_ENABLED_ENV,
  MAIL_OUTBOUND_RECONCILE_ENABLED_ENV,
  MAIL_GMAIL_WATCH_RENEW_ENABLED_ENV,
  MAIL_SYNC_RECONCILE_ENABLED_ENV,
] as const;

describe('scheduler-job-catalog', () => {
  it('covers every SCHEDULER_JOB_NAMES value', () => {
    const catalogNames = new Set(SCHEDULER_JOB_CATALOG.map((entry) => entry.jobName));
    for (const jobName of Object.values(SCHEDULER_JOB_NAMES)) {
      expect(catalogNames.has(jobName), `missing catalog entry for ${jobName}`).toBe(true);
    }
  });

  it('maps every startSchedulerCronJob enabledEnvKey to a platform_cron row', () => {
    const envKeys = new Set(
      listPlatformCronCatalogEntries()
        .map((entry) => entry.enabledEnvKey)
        .filter((key): key is string => key !== null),
    );
    for (const envKey of START_CRON_ENABLED_ENV_KEYS) {
      expect(envKeys.has(envKey), `catalog missing enabledEnvKey ${envKey}`).toBe(true);
    }
    expect(envKeys.size).toBe(START_CRON_ENABLED_ENV_KEYS.length);
  });

  it('has unique jobName values', () => {
    const names = SCHEDULER_JOB_CATALOG.map((entry) => entry.jobName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('rosterIntent=on platform crons match prod green set', () => {
    expect(listRosterOnPlatformCronJobNames()).toEqual([
      'billing',
      'client-services-renewal-invoice',
      'expense-plan-auto-due',
      'notification-enqueue-reconcile',
      'notification-inbox-reconcile',
      'overdue-invoices',
      'recurring-tasks-due',
      'report-schedules-due',
      'sales-kpi-month-close',
    ]);
  });

  it('lists only visibility=list entries for Settings', () => {
    for (const entry of SCHEDULER_JOB_CATALOG) {
      if (entry.visibility === SCHEDULER_JOB_VISIBILITY.hidden) {
        expect(entry.kind).not.toBe(SCHEDULER_JOB_KIND.platformCron);
      }
    }
  });
});
