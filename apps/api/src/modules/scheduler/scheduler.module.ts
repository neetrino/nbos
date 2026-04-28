import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from '../finance/billing/billing.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { ExpensePlanAutoDueCron } from './expense-plan-auto-due.cron';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), BillingModule, ExpensesModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, ExpensePlanAutoDueCron],
})
export class SchedulerModule {}
