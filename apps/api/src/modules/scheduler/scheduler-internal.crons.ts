import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { startSchedulerCronJob, stopSchedulerCronJob } from './scheduler-cron-bind';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';
import { SchedulerService } from './scheduler.service';
import {
  BILLING_CRON_ENABLED_ENV,
  BILLING_CRON_ENV,
  BILLING_DEFAULT_CRON,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENABLED_ENV,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENV,
  EXPENSE_BACKLOG_REMINDERS_DEFAULT_CRON,
  INVOICE_CARD_REMINDERS_CRON_ENABLED_ENV,
  INVOICE_CARD_REMINDERS_CRON_ENV,
  INVOICE_CARD_REMINDERS_DEFAULT_CRON,
  OVERDUE_INVOICES_CRON_ENABLED_ENV,
  OVERDUE_INVOICES_CRON_ENV,
  OVERDUE_INVOICES_DEFAULT_CRON,
  SALES_KPI_MONTH_CLOSE_CRON_ENABLED_ENV,
  SALES_KPI_MONTH_CLOSE_CRON_ENV,
  SALES_KPI_MONTH_CLOSE_DEFAULT_CRON,
  SUPPORT_SLA_ESCALATION_CRON_ENABLED_ENV,
  SUPPORT_SLA_ESCALATION_CRON_ENV,
  SUPPORT_SLA_ESCALATION_DEFAULT_CRON,
} from './scheduler-internal-cron.constants';

type CronRun = (service: SchedulerService) => Promise<unknown>;

function createInternalCron(
  className: string,
  jobName: string,
  enabledEnvKey: string,
  cronEnvKey: string,
  defaultExpression: string,
  run: CronRun,
): new (
  config: ConfigService,
  schedulerRegistry: SchedulerRegistry,
  schedulerService: SchedulerService,
  jobRegistry: ScheduledJobRegistry,
) => OnModuleInit & OnModuleDestroy {
  @Injectable()
  class InternalCron implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(className);

    constructor(
      private readonly config: ConfigService,
      private readonly schedulerRegistry: SchedulerRegistry,
      private readonly schedulerService: SchedulerService,
      private readonly jobRegistry: ScheduledJobRegistry,
    ) {}

    onModuleInit(): void {
      startSchedulerCronJob({
        jobName,
        enabledEnvKey,
        cronEnvKey,
        defaultExpression,
        config: this.config,
        schedulerRegistry: this.schedulerRegistry,
        jobRegistry: this.jobRegistry,
        logger: this.logger,
        run: () => run(this.schedulerService),
      });
    }

    onModuleDestroy(): void {
      stopSchedulerCronJob(jobName, this.schedulerRegistry);
    }
  }
  Object.defineProperty(InternalCron, 'name', { value: className });
  return InternalCron;
}

export const BillingCron = createInternalCron(
  'BillingCron',
  SCHEDULER_JOB_NAMES.billing,
  BILLING_CRON_ENABLED_ENV,
  BILLING_CRON_ENV,
  BILLING_DEFAULT_CRON,
  (service) => service.runBilling('cron'),
);

export const OverdueInvoicesCron = createInternalCron(
  'OverdueInvoicesCron',
  SCHEDULER_JOB_NAMES.overdueInvoices,
  OVERDUE_INVOICES_CRON_ENABLED_ENV,
  OVERDUE_INVOICES_CRON_ENV,
  OVERDUE_INVOICES_DEFAULT_CRON,
  (service) => service.markOverdueInvoices('cron'),
);

export const InvoiceCardRemindersCron = createInternalCron(
  'InvoiceCardRemindersCron',
  SCHEDULER_JOB_NAMES.invoiceCardReminders,
  INVOICE_CARD_REMINDERS_CRON_ENABLED_ENV,
  INVOICE_CARD_REMINDERS_CRON_ENV,
  INVOICE_CARD_REMINDERS_DEFAULT_CRON,
  (service) => service.runInvoiceCardReminders('cron'),
);

export const ExpenseBacklogRemindersCron = createInternalCron(
  'ExpenseBacklogRemindersCron',
  SCHEDULER_JOB_NAMES.expenseBacklogReminders,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENABLED_ENV,
  EXPENSE_BACKLOG_REMINDERS_CRON_ENV,
  EXPENSE_BACKLOG_REMINDERS_DEFAULT_CRON,
  (service) => service.runExpenseBacklogReminders('cron'),
);

export const SalesKpiMonthCloseCron = createInternalCron(
  'SalesKpiMonthCloseCron',
  SCHEDULER_JOB_NAMES.salesKpiMonthClose,
  SALES_KPI_MONTH_CLOSE_CRON_ENABLED_ENV,
  SALES_KPI_MONTH_CLOSE_CRON_ENV,
  SALES_KPI_MONTH_CLOSE_DEFAULT_CRON,
  (service) => service.runSalesKpiMonthClose(undefined, 'cron'),
);

export const SupportSlaEscalationCron = createInternalCron(
  'SupportSlaEscalationCron',
  SCHEDULER_JOB_NAMES.supportSlaEscalation,
  SUPPORT_SLA_ESCALATION_CRON_ENABLED_ENV,
  SUPPORT_SLA_ESCALATION_CRON_ENV,
  SUPPORT_SLA_ESCALATION_DEFAULT_CRON,
  (service) => service.runSupportSlaEscalation('cron'),
);

export const INTERNAL_SCHEDULER_CRON_PROVIDERS = [
  BillingCron,
  OverdueInvoicesCron,
  InvoiceCardRemindersCron,
  ExpenseBacklogRemindersCron,
  SalesKpiMonthCloseCron,
  SupportSlaEscalationCron,
] as const;
