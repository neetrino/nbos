import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionCleanupCron } from './auth-session-cleanup.cron';
import { MailGmailWatchRenewCron } from './mail-gmail-watch-renew.cron';
import { MailOutboundReconcileCron } from './mail-outbound-reconcile.cron';
import { MailSyncReconcileCron } from './mail-sync-reconcile.cron';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { ClientServicesRenewalInvoiceCron } from './client-services-renewal-invoice.cron';
import { NotificationEnqueueReconcileCron } from './notification-enqueue-reconcile.cron';
import { NotificationInboxReconcileCron } from './notification-inbox-reconcile.cron';
import { PlatformTrashPurgeCron } from './platform-trash-purge.cron';
import { RecurringTasksDueCron } from './recurring-tasks-due.cron';
import { ReportSchedulesDueCron } from './report-schedules-due.cron';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { INTERNAL_SCHEDULER_CRON_PROVIDERS } from './scheduler-internal.crons';
import { SchedulerService } from './scheduler.service';

const CRON_PROVIDERS = [
  ExpensePlanAutoDueCron,
  ClientServicesRenewalInvoiceCron,
  ReportSchedulesDueCron,
  RecurringTasksDueCron,
  PlatformTrashPurgeCron,
  NotificationInboxReconcileCron,
  NotificationEnqueueReconcileCron,
  AuthSessionCleanupCron,
  MailOutboundReconcileCron,
  MailGmailWatchRenewCron,
  MailSyncReconcileCron,
  ...INTERNAL_SCHEDULER_CRON_PROVIDERS,
] as const;

const EXPECTED_PROD_GREEN_JOBS = [
  'billing',
  'expense-plan-auto-due',
  'notification-enqueue-reconcile',
  'notification-inbox-reconcile',
  'overdue-invoices',
  'recurring-tasks-due',
  'report-schedules-due',
  'sales-kpi-month-close',
];

const ABSENT_YELLOW_JOBS = [
  'auth-session-expiry-cleanup',
  'client-services-renewal-invoice',
  'expense-backlog-reminders',
  'invoice-card-reminders',
  'platform-trash-purge',
  'support-sla-escalation',
  'mail-outbound-reconcile',
  'mail-gmail-watch-renew',
  'mail-sync-reconcile',
];

function createSchedulerServiceMock(): SchedulerService {
  return {
    runBilling: vi.fn().mockResolvedValue({}),
    markOverdueInvoices: vi.fn().mockResolvedValue({}),
    runExpensePlanAutoDue: vi.fn().mockResolvedValue({}),
    runInvoiceCardReminders: vi.fn().mockResolvedValue({}),
    runExpenseBacklogReminders: vi.fn().mockResolvedValue({}),
    runReportSchedulesDue: vi.fn().mockResolvedValue({}),
    runSalesKpiBackfillAll: vi.fn().mockResolvedValue({}),
    runSalesKpiMonthClose: vi.fn().mockResolvedValue({}),
    runPlatformTrashPurge: vi.fn().mockResolvedValue({}),
    runSupportSlaEscalation: vi.fn().mockResolvedValue({}),
    runNotificationInboxReconcile: vi.fn().mockResolvedValue({}),
    runNotificationEnqueueReconcile: vi.fn().mockResolvedValue({}),
    runRecurringTasksDue: vi.fn().mockResolvedValue({}),
    runAuthSessionExpiryCleanup: vi.fn().mockResolvedValue({}),
    runClientServicesRenewalInvoice: vi.fn().mockResolvedValue({}),
    runMailOutboundReconcile: vi.fn().mockResolvedValue({}),
    runMailGmailWatchRenew: vi.fn().mockResolvedValue({}),
    runMailSyncReconcile: vi.fn().mockResolvedValue({}),
  } as unknown as SchedulerService;
}

function applySchedulerRoleEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...base,
    NODE_ENV: 'development',
    PROCESS_ROLE: 'scheduler',
    TZ: 'Asia/Yerevan',
    SCHEDULER_BILLING_ENABLED: 'true',
    SCHEDULER_OVERDUE_INVOICES_ENABLED: 'true',
    SCHEDULER_SALES_KPI_MONTH_CLOSE_ENABLED: 'true',
    SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED: 'true',
    SCHEDULER_RECURRING_TASKS_DUE_ENABLED: 'true',
    SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED: 'true',
    SCHEDULER_NOTIFICATION_ENQUEUE_RECONCILE_ENABLED: 'true',
    REPORT_SCHEDULES_DUE_CRON_ENABLED: 'true',
    SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED: 'false',
    SCHEDULER_MAIL_OUTBOUND_RECONCILE_ENABLED: 'false',
    SCHEDULER_MAIL_GMAIL_WATCH_RENEW_ENABLED: 'false',
    SCHEDULER_MAIL_SYNC_RECONCILE_ENABLED: 'false',
    SCHEDULER_PLATFORM_TRASH_PURGE_ENABLED: 'false',
    SCHEDULER_AUTH_SESSION_CLEANUP_ENABLED: 'false',
    SCHEDULER_INVOICE_CARD_REMINDERS_ENABLED: 'false',
    SCHEDULER_EXPENSE_BACKLOG_REMINDERS_ENABLED: 'false',
    SCHEDULER_SUPPORT_SLA_ESCALATION_ENABLED: 'false',
  };
}

async function bootSchedulerCronModule(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [ScheduleModule.forRoot()],
    providers: [
      ScheduledJobRegistry,
      { provide: ConfigService, useValue: { get: () => undefined } },
      { provide: SchedulerService, useValue: createSchedulerServiceMock() },
      ...CRON_PROVIDERS,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

function assertProdGreenCronRegistration(app: INestApplication, schedulerEnabled: boolean): void {
  const jobRegistry = app.get(ScheduledJobRegistry);
  const schedulerRegistry = app.get(SchedulerRegistry);

  expect(jobRegistry.list()).toEqual(EXPECTED_PROD_GREEN_JOBS);
  expect([...schedulerRegistry.getCronJobs().keys()].sort()).toEqual(EXPECTED_PROD_GREEN_JOBS);
  expect(() => jobRegistry.assertHasScheduledJobsWhenEnabled(schedulerEnabled)).not.toThrow();

  for (const jobName of ABSENT_YELLOW_JOBS) {
    expect(jobRegistry.list()).not.toContain(jobName);
    expect(schedulerRegistry.doesExist('cron', jobName)).toBe(false);
  }
}

describe('scheduler cron registration (scheduler role)', () => {
  const originalEnv = { ...process.env };
  let app: INestApplication | undefined;

  beforeEach(() => {
    process.env = applySchedulerRoleEnv(originalEnv);
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    process.env = { ...originalEnv };
  });

  it('registers prod-green crons when SCHEDULER_ENABLED=false (paused ticks)', async () => {
    process.env.SCHEDULER_ENABLED = 'false';
    app = await bootSchedulerCronModule();
    assertProdGreenCronRegistration(app, false);
  });

  it('registers prod-green crons when SCHEDULER_ENABLED=true (active ticks)', async () => {
    process.env.SCHEDULER_ENABLED = 'true';
    app = await bootSchedulerCronModule();
    assertProdGreenCronRegistration(app, true);
  });
});
