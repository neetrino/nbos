import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [OrdersModule, InvoicesModule],
})
export class FinanceModule {}
