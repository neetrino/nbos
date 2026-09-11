import { Module } from '@nestjs/common';
import { DealsModule } from '../../crm/deals/deals.module';
import { WhatsAppGatewayModule } from '../../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { InvoiceCardRemindersService } from './invoice-card-reminders.service';
import { InvoiceOfficialWhatsAppModule } from './invoice-official-whatsapp.module';
import { InvoiceOverdueRemindersService } from './invoice-overdue-reminders.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    DealsModule,
    OperationalJournalModule,
    WhatsAppGatewayModule,
    InvoiceOfficialWhatsAppModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceCardRemindersService, InvoiceOverdueRemindersService],
  exports: [InvoicesService, InvoiceCardRemindersService, InvoiceOfficialWhatsAppModule],
})
export class InvoicesModule {}
