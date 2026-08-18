import { Module } from '@nestjs/common';
import { ClientServicesController } from './client-services.controller';
import { ClientServicesService } from './client-services.service';
import { ClientPaidInvoiceAutomationService } from './client-paid-invoice-automation.service';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [InvoicesModule, ExpensesModule, TasksModule],
  controllers: [ClientServicesController],
  providers: [
    ClientServicesService,
    ClientServiceFlowsService,
    ClientPaidInvoiceAutomationService,
    ClientServicesRenewalInvoiceService,
  ],
  exports: [
    ClientServicesService,
    ClientServiceFlowsService,
    ClientPaidInvoiceAutomationService,
    ClientServicesRenewalInvoiceService,
  ],
})
export class ClientServicesModule {}
