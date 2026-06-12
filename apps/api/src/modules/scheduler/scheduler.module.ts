import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from '../finance/billing/billing.module';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { ReportsModule } from '../reports/reports.module';
import { PayrollRunsModule } from '../payroll-runs/payroll-runs.module';
import { SupportModule } from '../support/support.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { PlatformLifecycleModule } from '../platform-lifecycle/platform-lifecycle.module';
import { CredentialTrashPurgeCron } from './credential-trash-purge.cron';
import { PlatformTrashPurgeCron } from './platform-trash-purge.cron';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { ReportSchedulesDueCron } from './report-schedules-due.cron';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { ServiceApiKeyGuard } from '../../common/guards/service-api-key.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BillingModule,
    InvoicesModule,
    ExpensesModule,
    ReportsModule,
    SupportModule,
    PayrollRunsModule,
    CredentialsModule,
    PlatformLifecycleModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    ExpensePlanAutoDueCron,
    ReportSchedulesDueCron,
    CredentialTrashPurgeCron,
    PlatformTrashPurgeCron,
    ServiceApiKeyGuard,
  ],
})
export class SchedulerModule {}
