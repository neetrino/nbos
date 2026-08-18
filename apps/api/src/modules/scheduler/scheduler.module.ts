import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from '../finance/billing/billing.module';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { ReportsModule } from '../reports/reports.module';
import { PayrollRunsModule } from '../payroll-runs/payroll-runs.module';
import { SupportModule } from '../support/support.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { PlatformLifecycleModule } from '../platform-lifecycle/platform-lifecycle.module';
import { WhatsAppGatewayModule } from '../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { NotificationModule } from '../notifications/notification.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { RecurringTasksDueCron } from './recurring-tasks-due.cron';
import { PlatformTrashPurgeCron } from './platform-trash-purge.cron';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { ReportSchedulesDueCron } from './report-schedules-due.cron';
import { NotificationInboxReconcileCron } from './notification-inbox-reconcile.cron';
import { NotificationEnqueueReconcileCron } from './notification-enqueue-reconcile.cron';
import { AuthSessionCleanupCron } from './auth-session-cleanup.cron';
import { INTERNAL_SCHEDULER_CRON_PROVIDERS } from './scheduler-internal.crons';
import { SchedulerController } from './scheduler.controller';
import { SchedulerDiagnosticsController } from './scheduler-diagnostics.controller';
import { SchedulerReadyController } from './scheduler-ready.controller';
import { SchedulerService } from './scheduler.service';
import { SchedulerLeaseService } from './scheduler-lease.service';
import { SchedulerRunService } from './scheduler-run.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { ServiceApiKeyGuard } from '../../common/guards/service-api-key.guard';
import { shouldRegisterScheduledJobs } from '../../runtime/process-role';

const SCHEDULER_IMPORTS = [
  BillingModule,
  InvoicesModule,
  ExpensesModule,
  ReportsModule,
  SupportModule,
  PayrollRunsModule,
  CredentialsModule,
  PlatformLifecycleModule,
  WhatsAppGatewayModule,
  NotificationModule,
  RealtimeModule,
  AuthModule,
  TasksModule,
] as const;

const CRON_PROVIDERS = [
  ExpensePlanAutoDueCron,
  ReportSchedulesDueCron,
  RecurringTasksDueCron,
  PlatformTrashPurgeCron,
  NotificationInboxReconcileCron,
  NotificationEnqueueReconcileCron,
  AuthSessionCleanupCron,
  ...INTERNAL_SCHEDULER_CRON_PROVIDERS,
] as const;

/**
 * Scheduler domain: HTTP triggers + optional Nest CronJobs.
 * Cron providers are registered only for PROCESS_ROLE=scheduler|all.
 */
@Module({})
export class SchedulerModule {
  static forRoot(): DynamicModule {
    const includeCrons = shouldRegisterScheduledJobs();
    return {
      module: SchedulerModule,
      imports: [...(includeCrons ? [ScheduleModule.forRoot()] : []), ...SCHEDULER_IMPORTS],
      controllers: [SchedulerController, SchedulerDiagnosticsController, SchedulerReadyController],
      providers: [
        SchedulerService,
        SchedulerLeaseService,
        SchedulerRunService,
        ScheduledJobRegistry,
        ServiceApiKeyGuard,
        ...(includeCrons ? [...CRON_PROVIDERS] : []),
      ],
      exports: [SchedulerService, SchedulerLeaseService, ScheduledJobRegistry, SchedulerRunService],
    };
  }
}
