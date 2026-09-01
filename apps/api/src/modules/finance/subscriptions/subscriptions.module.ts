import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { InvoiceOfficialWhatsAppModule } from '../invoices/invoice-official-whatsapp.module';
import { SubscriptionPeriodInvoiceService } from './subscription-period-invoice.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [InvoicesModule, InvoiceOfficialWhatsAppModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionPeriodInvoiceService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
