import { Module } from '@nestjs/common';
import { InvoiceCardRemindersService } from './invoice-card-reminders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceCardRemindersService],
  exports: [InvoicesService, InvoiceCardRemindersService],
})
export class InvoicesModule {}
