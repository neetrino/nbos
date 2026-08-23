import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiModelCatalogSyncCron } from './ai-model-catalog-sync.cron';
import { AuthSessionCleanupCron } from './auth-session-cleanup.cron';
import { SchedulerAiService } from './scheduler-ai.service';
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
import { listPlatformCronCatalogEntries } from './scheduler-job-catalog';
import {
  resetSchedulerJobPolicyChecker,
  setSchedulerJobPolicyChecker,
} from './scheduler-job-policy.accessor';

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
  AiModelCatalogSyncCron,
  ...INTERNAL_SCHEDULER_CRON_PROVIDERS,
] as const;

const ALL_PLATFORM_CRON_JOBS = listPlatformCronCatalogEntries()
  .map((entry) => entry.jobName)
  .sort();

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
  };
}

async function bootSchedulerCronModule(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [ScheduleModule.forRoot()],
    providers: [
      ScheduledJobRegistry,
      { provide: ConfigService, useValue: { get: () => undefined } },
      { provide: SchedulerService, useValue: createSchedulerServiceMock() },
      {
        provide: SchedulerAiService,
        useValue: { runAiModelCatalogSync: vi.fn().mockResolvedValue({}) },
      },
      ...CRON_PROVIDERS,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('scheduler cron registration (scheduler role)', () => {
  const originalEnv = { ...process.env };
  let app: INestApplication | undefined;

  beforeEach(() => {
    process.env = applySchedulerRoleEnv(originalEnv);
    setSchedulerJobPolicyChecker(async () => true);
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    resetSchedulerJobPolicyChecker();
    process.env = { ...originalEnv };
  });

  it('registers all platform crons when SCHEDULER_ENABLED=false (paused ticks)', async () => {
    process.env.SCHEDULER_ENABLED = 'false';
    app = await bootSchedulerCronModule();
    const jobRegistry = app.get(ScheduledJobRegistry);
    const schedulerRegistry = app.get(SchedulerRegistry);
    expect(jobRegistry.list()).toEqual(ALL_PLATFORM_CRON_JOBS);
    expect([...schedulerRegistry.getCronJobs().keys()].sort()).toEqual(ALL_PLATFORM_CRON_JOBS);
    expect(() => jobRegistry.assertHasScheduledJobsWhenEnabled(false)).not.toThrow();
  });

  it('registers all platform crons when SCHEDULER_ENABLED=true', async () => {
    process.env.SCHEDULER_ENABLED = 'true';
    app = await bootSchedulerCronModule();
    const jobRegistry = app.get(ScheduledJobRegistry);
    expect(jobRegistry.list()).toEqual(ALL_PLATFORM_CRON_JOBS);
    expect(() => jobRegistry.assertHasScheduledJobsWhenEnabled(true)).not.toThrow();
  });
});
