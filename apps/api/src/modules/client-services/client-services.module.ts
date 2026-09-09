import { Module } from '@nestjs/common';
import { ClientServicesController } from './client-services.controller';
import { ClientServicesService } from './client-services.service';
import { ClientPaidInvoiceAutomationService } from './client-paid-invoice-automation.service';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { ClientServicesRenewalInvoiceService } from './client-services-renewal-invoice.service';
import { DomainRegistryService } from './registry/domain-registry.service';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [InvoicesModule, ExpensesModule, TasksModule, AuditModule],
  controllers: [ClientServicesController],
  providers: [
    ClientServicesService,
    ClientServiceFlowsService,
    ClientPaidInvoiceAutomationService,
    ClientServicesRenewalInvoiceService,
    DomainRegistryService,
  ],
  exports: [
    ClientServicesService,
    ClientServiceFlowsService,
    ClientPaidInvoiceAutomationService,
    ClientServicesRenewalInvoiceService,
    DomainRegistryService,
  ],
})
export class ClientServicesModule {}
