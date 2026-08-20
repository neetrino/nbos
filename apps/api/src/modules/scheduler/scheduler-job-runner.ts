import { BadRequestException } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SALES_KPI_BACKFILL_ALL_JOB_NAME } from './scheduler-job-catalog';
import { SCHEDULER_JOB_NAMES, type SchedulerTrigger } from './scheduler-lease.constants';

type JobRunner = (service: SchedulerService, trigger: SchedulerTrigger) => Promise<unknown>;

const RUNNERS: Record<string, JobRunner> = {
  [SCHEDULER_JOB_NAMES.billing]: (service, trigger) => service.runBilling(trigger),
  [SCHEDULER_JOB_NAMES.overdueInvoices]: (service, trigger) => service.markOverdueInvoices(trigger),
  [SCHEDULER_JOB_NAMES.invoiceCardReminders]: (service, trigger) =>
    service.runInvoiceCardReminders(trigger),
  [SCHEDULER_JOB_NAMES.expenseBacklogReminders]: (service, trigger) =>
    service.runExpenseBacklogReminders(trigger),
  [SCHEDULER_JOB_NAMES.salesKpiMonthClose]: (service, trigger) =>
    service.runSalesKpiMonthClose(undefined, trigger),
  [SCHEDULER_JOB_NAMES.expensePlanAutoDue]: (service, trigger) =>
    service.runExpensePlanAutoDue(trigger),
  [SCHEDULER_JOB_NAMES.recurringTasksDue]: (service, trigger) =>
    service.runRecurringTasksDue(trigger),
  [SCHEDULER_JOB_NAMES.clientServicesRenewalInvoice]: (service, trigger) =>
    service.runClientServicesRenewalInvoice(trigger),
  [SCHEDULER_JOB_NAMES.platformTrashPurge]: (service, trigger) =>
    service.runPlatformTrashPurge(trigger),
  [SCHEDULER_JOB_NAMES.supportSlaEscalation]: (service, trigger) =>
    service.runSupportSlaEscalation(trigger),
  [SCHEDULER_JOB_NAMES.notificationInboxReconcile]: (service, trigger) =>
    service.runNotificationInboxReconcile(trigger),
  [SCHEDULER_JOB_NAMES.notificationEnqueueReconcile]: (service, trigger) =>
    service.runNotificationEnqueueReconcile(trigger),
  [SCHEDULER_JOB_NAMES.authSessionExpiryCleanup]: (service, trigger) =>
    service.runAuthSessionExpiryCleanup(trigger),
  [SCHEDULER_JOB_NAMES.reportSchedulesDue]: (service, trigger) =>
    service.runReportSchedulesDue(trigger),
  [SCHEDULER_JOB_NAMES.mailOutboundReconcile]: (service, trigger) =>
    service.runMailOutboundReconcile(trigger),
  [SCHEDULER_JOB_NAMES.mailGmailWatchRenew]: (service, trigger) =>
    service.runMailGmailWatchRenew(trigger),
  [SCHEDULER_JOB_NAMES.mailSyncReconcile]: (service, trigger) =>
    service.runMailSyncReconcile(trigger),
  [SALES_KPI_BACKFILL_ALL_JOB_NAME]: (service, trigger) => service.runSalesKpiBackfillAll(trigger),
};

export function canRunSchedulerJobNow(jobName: string): boolean {
  return Object.prototype.hasOwnProperty.call(RUNNERS, jobName);
}

export async function runSchedulerJobByName(
  service: SchedulerService,
  jobName: string,
  trigger: SchedulerTrigger,
): Promise<unknown> {
  const runner = RUNNERS[jobName];
  if (!runner) {
    throw new BadRequestException(`No runner for scheduler job: ${jobName}`);
  }
  return runner(service, trigger);
}
