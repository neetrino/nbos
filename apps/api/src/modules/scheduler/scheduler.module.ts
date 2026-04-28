import { Module } from '@nestjs/common';
import { BillingModule } from '../finance/billing/billing.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [BillingModule, ExpensesModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
