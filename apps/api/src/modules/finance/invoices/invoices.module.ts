import { Module } from '@nestjs/common';
import { DealsModule } from '../../crm/deals/deals.module';
import { InvoiceCardRemindersService } from './invoice-card-reminders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [DealsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceCardRemindersService],
  exports: [InvoicesService, InvoiceCardRemindersService],
})
export class InvoicesModule {}
