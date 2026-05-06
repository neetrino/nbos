import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from '../finance/billing/billing.module';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { ReportsModule } from '../reports/reports.module';
import { SupportModule } from '../support/support.module';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { ReportSchedulesDueCron } from './report-schedules-due.cron';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BillingModule,
    InvoicesModule,
    ExpensesModule,
    ReportsModule,
    SupportModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, ExpensePlanAutoDueCron, ReportSchedulesDueCron],
})
export class SchedulerModule {}
