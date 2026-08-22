import { BadRequestException } from '@nestjs/common';
import { SchedulerAiService } from './scheduler-ai.service';
import { SchedulerService } from './scheduler.service';
import { SALES_KPI_BACKFILL_ALL_JOB_NAME } from './scheduler-job-catalog';
import { SCHEDULER_JOB_NAMES, type SchedulerTrigger } from './scheduler-lease.constants';

/**
 * Services a manual run may dispatch to. AI jobs live on their own service, so
 * the runner takes the set rather than a single `SchedulerService`.
 */
export interface SchedulerJobRunners {
  scheduler: SchedulerService;
  ai: SchedulerAiService;
}

const RUNNABLE_JOB_NAMES = [
  SCHEDULER_JOB_NAMES.billing,
  SCHEDULER_JOB_NAMES.overdueInvoices,
  SCHEDULER_JOB_NAMES.invoiceCardReminders,
  SCHEDULER_JOB_NAMES.expenseBacklogReminders,
  SCHEDULER_JOB_NAMES.salesKpiMonthClose,
  SCHEDULER_JOB_NAMES.expensePlanAutoDue,
  SCHEDULER_JOB_NAMES.recurringTasksDue,
  SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice,
  SCHEDULER_JOB_NAMES.platformTrashPurge,
  SCHEDULER_JOB_NAMES.supportSlaEscalation,
  SCHEDULER_JOB_NAMES.notificationInboxReconcile,
  SCHEDULER_JOB_NAMES.notificationEnqueueReconcile,
  SCHEDULER_JOB_NAMES.authSessionExpiryCleanup,
  SCHEDULER_JOB_NAMES.reportSchedulesDue,
  SCHEDULER_JOB_NAMES.mailOutboundReconcile,
  SCHEDULER_JOB_NAMES.mailGmailWatchRenew,
  SCHEDULER_JOB_NAMES.mailSyncReconcile,
  SCHEDULER_JOB_NAMES.aiModelCatalogSync,
  SALES_KPI_BACKFILL_ALL_JOB_NAME,
] as const;

type RunnableJobName = (typeof RUNNABLE_JOB_NAMES)[number];

export function canRunSchedulerJobNow(jobName: string): boolean {
  return (RUNNABLE_JOB_NAMES as readonly string[]).includes(jobName);
}

/**
 * Dispatches by explicit switch (allowlist) so jobName from HTTP cannot select
 * an arbitrary SchedulerService method.
 */
export async function runSchedulerJobByName(
  runners: SchedulerJobRunners,
  jobName: string,
  trigger: SchedulerTrigger,
): Promise<unknown> {
  if (!canRunSchedulerJobNow(jobName)) {
    throw new BadRequestException(`No runner for scheduler job: ${jobName}`);
  }
  return dispatchRunnableJob(runners, jobName as RunnableJobName, trigger);
}

async function dispatchRunnableJob(
  runners: SchedulerJobRunners,
  jobName: RunnableJobName,
  trigger: SchedulerTrigger,
): Promise<unknown> {
  const service = runners.scheduler;
  switch (jobName) {
    case SCHEDULER_JOB_NAMES.aiModelCatalogSync:
      return runners.ai.runAiModelCatalogSync(trigger);
    case SCHEDULER_JOB_NAMES.billing:
      return service.runBilling(trigger);
    case SCHEDULER_JOB_NAMES.overdueInvoices:
      return service.markOverdueInvoices(trigger);
    case SCHEDULER_JOB_NAMES.invoiceCardReminders:
      return service.runInvoiceCardReminders(trigger);
    case SCHEDULER_JOB_NAMES.expenseBacklogReminders:
      return service.runExpenseBacklogReminders(trigger);
    case SCHEDULER_JOB_NAMES.salesKpiMonthClose:
      return service.runSalesKpiMonthClose(undefined, trigger);
    case SCHEDULER_JOB_NAMES.expensePlanAutoDue:
      return service.runExpensePlanAutoDue(trigger);
    case SCHEDULER_JOB_NAMES.recurringTasksDue:
      return service.runRecurringTasksDue(trigger);
    case SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice:
      return service.runClientServicesRenewalInvoice(trigger);
    case SCHEDULER_JOB_NAMES.platformTrashPurge:
      return service.runPlatformTrashPurge(trigger);
    case SCHEDULER_JOB_NAMES.supportSlaEscalation:
      return service.runSupportSlaEscalation(trigger);
    case SCHEDULER_JOB_NAMES.notificationInboxReconcile:
      return service.runNotificationInboxReconcile(trigger);
    case SCHEDULER_JOB_NAMES.notificationEnqueueReconcile:
      return service.runNotificationEnqueueReconcile(trigger);
    case SCHEDULER_JOB_NAMES.authSessionExpiryCleanup:
      return service.runAuthSessionExpiryCleanup(trigger);
    case SCHEDULER_JOB_NAMES.reportSchedulesDue:
      return service.runReportSchedulesDue(trigger);
    case SCHEDULER_JOB_NAMES.mailOutboundReconcile:
      return service.runMailOutboundReconcile(trigger);
    case SCHEDULER_JOB_NAMES.mailGmailWatchRenew:
      return service.runMailGmailWatchRenew(trigger);
    case SCHEDULER_JOB_NAMES.mailSyncReconcile:
      return service.runMailSyncReconcile(trigger);
    case SALES_KPI_BACKFILL_ALL_JOB_NAME:
      return service.runSalesKpiBackfillAll(trigger);
    default: {
      const _exhaustive: never = jobName;
      throw new BadRequestException(`No runner for scheduler job: ${_exhaustive}`);
    }
  }
}
