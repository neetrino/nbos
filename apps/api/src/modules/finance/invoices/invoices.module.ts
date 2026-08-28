import { Module } from '@nestjs/common';
import { DealsModule } from '../../crm/deals/deals.module';
import { WhatsAppGatewayModule } from '../../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { InvoiceCardRemindersService } from './invoice-card-reminders.service';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';
import { InvoiceOverdueRemindersService } from './invoice-overdue-reminders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [DealsModule, OperationalJournalModule, WhatsAppGatewayModule],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceCardRemindersService,
    InvoiceOfficialWhatsAppService,
    InvoiceOverdueRemindersService,
  ],
  exports: [InvoicesService, InvoiceCardRemindersService, InvoiceOfficialWhatsAppService],
})
export class InvoicesModule {}
