import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { OperationalJournalModule } from '../finance/journal/operational-journal.module';
import { ExpensesController } from './expenses.controller';
import { ExpensePlansController } from './expense-plans.controller';
import { ExpenseBacklogRemindersService } from './expense-backlog-reminders.service';
import { ExpensesService } from './expenses.service';
import { ExpensePlansService } from './expense-plans.service';

@Module({
  imports: [NotificationModule, OperationalJournalModule],
  controllers: [ExpensesController, ExpensePlansController],
  providers: [ExpensesService, ExpensePlansService, ExpenseBacklogRemindersService],
  exports: [ExpensesService, ExpensePlansService, ExpenseBacklogRemindersService],
})
export class ExpensesModule {}
