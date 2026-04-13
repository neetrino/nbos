import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [OrdersModule, InvoicesModule, PaymentsModule, SubscriptionsModule, BillingModule],
})
export class FinanceModule {}
