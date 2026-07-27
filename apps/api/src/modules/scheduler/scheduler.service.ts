import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { BillingService } from '../finance/billing/billing.service';
import { InvoiceCardRemindersService } from '../finance/invoices/invoice-card-reminders.service';
import { ExpenseBacklogRemindersService } from '../expenses/expense-backlog-reminders.service';
import { ExpensePlansService } from '../expenses/expense-plans.service';
import { ReportsScheduleRunnerService } from '../reports/reports-schedule-runner.service';
import { SalesKpiMonthCloseService } from '../payroll-runs/sales-kpi-month-close.service';
import { backfillSalesKpiAndPayablesForAllEarnedPeriods } from '../payroll-runs/run-sales-kpi-month-close';
import { SupportSlaOrchestrationService } from '../support/support-sla-orchestration.service';
import { CredentialsTrashPurgeService } from '../credentials/credentials-trash-purge.service';
import { PlatformTrashPurgeService } from '../platform-lifecycle/platform-trash-purge.service';
import { ProductWhatsAppGroupService } from '../integrations/whatsapp-gateway/product-whatsapp-group.service';
import { NotificationInboxReconcileService } from '../notifications/notification-inbox-reconcile.service';
import { NotificationEnqueueReconcileService } from '../notifications/notification-enqueue-reconcile.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { SchedulerLeaseService } from './scheduler-lease.service';
import {
  SCHEDULER_JOB_NAMES,
  SCHEDULER_TRIGGER,
  type SchedulerTrigger,
} from './scheduler-lease.constants';

interface OverdueResult {
  marked: number;
  invoiceIds: string[];
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly billingService: BillingService,
    private readonly invoiceCardRemindersService: InvoiceCardRemindersService,
    private readonly expenseBacklogRemindersService: ExpenseBacklogRemindersService,
    private readonly expensePlansService: ExpensePlansService,
    private readonly reportsScheduleRunnerService: ReportsScheduleRunnerService,
    private readonly supportSlaOrchestrationService: SupportSlaOrchestrationService,
    private readonly salesKpiMonthClose: SalesKpiMonthCloseService,
    private readonly credentialsTrashPurgeService: CredentialsTrashPurgeService,
    private readonly platformTrashPurgeService: PlatformTrashPurgeService,
    private readonly productWhatsApp: ProductWhatsAppGroupService,
    private readonly notificationInboxReconcile: NotificationInboxReconcileService,
    private readonly notificationEnqueueReconcile: NotificationEnqueueReconcileService,
    private readonly authSessions: AuthSessionService,
    private readonly lease: SchedulerLeaseService,
  ) {}

  async runBilling(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.billing, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        this.logger.log('Scheduler: running monthly billing');
        const result = await this.billingService.runMonthlyBilling();
        return {
          processedCount: result.generatedInvoices,
          metadata: { totalAmount: result.totalAmount },
        };
      },
    );
  }

  async runExpenses(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.expenses, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.billingService.runMonthlyExpenses();
        return { processedCount: result.generated };
      },
    );
  }

  async markOverdueInvoices(
    trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp,
  ): Promise<{ status: string; runId: string | null; result?: OverdueResult }> {
    const leaseResult = await this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.overdueInvoices, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const now = new Date();
        const overdueInvoices = await this.prisma.invoice.findMany({
          where: {
            moneyStatus: {
              notIn: [
                'PAID',
                'CANCELLED',
                'ON_HOLD',
                'OVERDUE',
              ] as Prisma.EnumInvoiceMoneyStatusEnumFilter['notIn'],
            },
            dueDate: { lt: now },
          },
          select: { id: true, code: true },
        });
        if (overdueInvoices.length === 0) {
          return { processedCount: 0, metadata: { invoiceIds: [] } };
        }
        const ids = overdueInvoices.map((inv) => inv.id);
        await this.prisma.invoice.updateMany({
          where: { id: { in: ids } },
          data: {
            moneyStatus: 'OVERDUE' as Prisma.InvoiceUpdateManyMutationInput['moneyStatus'],
          },
        });
        return {
          processedCount: ids.length,
          metadata: { invoiceIds: ids },
        };
      },
    );
    return leaseResult;
  }

  async runExpensePlanAutoDue(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.expensePlanAutoDue, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.expensePlansService.autoGenerateDuePlans({});
        return {
          processedCount: result.created.length,
          metadata: {
            eligibleCount: result.eligibleCount,
            failures: result.failures.length,
          },
        };
      },
    );
  }

  async runInvoiceCardReminders(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.invoiceCardReminders, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.invoiceCardRemindersService.runDueInvoiceCardReminders();
        return {
          processedCount: result.created.length,
          metadata: {
            eligibleCount: result.eligibleCount,
            skippedExisting: result.skippedExisting,
          },
        };
      },
    );
  }

  async runExpenseBacklogReminders(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.expenseBacklogReminders, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.expenseBacklogRemindersService.runExpenseBacklogReminders();
        return {
          processedCount: result.due.created.length,
          metadata: {
            digest: result.digest,
            dueSkipped: result.due.skippedExisting,
          },
        };
      },
    );
  }

  async runReportSchedulesDue(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.reportSchedulesDue, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.reportsScheduleRunnerService.runDueSchedules();
        return {
          processedCount: result.processed,
          metadata: { failed: result.failed },
        };
      },
    );
  }

  async runSalesKpiBackfillAll(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: 'sales-kpi-backfill-all', trigger, ttlMs: 600_000 },
      async ({ signal }) => {
        if (signal.aborted) return;
        const results = await backfillSalesKpiAndPayablesForAllEarnedPeriods(this.prisma);
        return { processedCount: results.length };
      },
    );
  }

  async runSalesKpiMonthClose(
    body?: { earnedPeriod?: string },
    trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp,
  ) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.salesKpiMonthClose, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.salesKpiMonthClose.run(
          body?.earnedPeriod != null ? { earnedPeriod: body.earnedPeriod } : undefined,
        );
        return {
          processedCount: result.syncedCount,
          metadata: {
            earnedPeriod: result.earnedPeriod,
            skippedCount: result.skippedCount,
          },
        };
      },
    );
  }

  async runCredentialTrashPurge(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.credentialTrashPurge, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.credentialsTrashPurgeService.runRetentionPurge();
        return { processedCount: result.purged };
      },
    );
  }

  async runPlatformTrashPurge(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.platformTrashPurge, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.platformTrashPurgeService.runRetentionPurge();
        return { processedCount: result.totalPurged };
      },
    );
  }

  async runSupportSlaEscalation(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.supportSlaEscalation, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.supportSlaOrchestrationService.runSlaEscalationScan();
        return {
          processedCount: result.scanned,
          metadata: {
            warnings: result.warnings,
            responseBreaches: result.responseBreaches,
            resolveBreaches: result.resolveBreaches,
          },
        };
      },
    );
  }

  async runWhatsAppProductGroupsReconcile(
    trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp,
  ) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.whatsappProductGroupsReconcile, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.productWhatsApp.reconcileBatch(50);
        return {
          processedCount: result.operationsRequeued,
          metadata: { productsEnsured: result.productsEnsured },
        };
      },
    );
  }

  async runNotificationInboxReconcile(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.notificationInboxReconcile, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.notificationInboxReconcile.reconcileAll({
          mode: 'repair',
          publish: true,
        });
        return {
          processedCount: result.repaired,
          metadata: {
            scanned: result.scanned,
            matched: result.matched,
            drifted: result.drifted,
            missing: result.missing,
            negative: result.negative,
            maxAbsoluteDrift: result.maxAbsoluteDrift,
          },
        };
      },
    );
  }

  async runNotificationEnqueueReconcile(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.notificationEnqueueReconcile, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.notificationEnqueueReconcile.reconcilePending();
        return {
          processedCount: result.scannedJobs + result.scannedDeliveries,
          metadata: result,
        };
      },
    );
  }

  async runAuthSessionExpiryCleanup(trigger: SchedulerTrigger = SCHEDULER_TRIGGER.manualHttp) {
    return this.lease.runWithLease(
      { jobName: SCHEDULER_JOB_NAMES.authSessionExpiryCleanup, trigger },
      async ({ signal }) => {
        if (signal.aborted) return;
        const result = await this.authSessions.cleanupExpiredSessions();
        return {
          processedCount: result.marked,
          metadata: result,
        };
      },
    );
  }
}
