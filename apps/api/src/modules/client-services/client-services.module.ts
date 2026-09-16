import { Module } from '@nestjs/common';
import { ClientServicesController } from './client-services.controller';
import { DomainOperationController } from './domain-purchase/domain-operation.controller';
import { DomainOperationService } from './domain-purchase/domain-operation.service';
import { ClientServicesService } from './client-services.service';
import { ClientPaidInvoiceAutomationService } from './client-paid-invoice-automation.service';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { ClientServicesRenewalInvoiceService } from './client-services-renewal-invoice.service';
import { DomainRegistryService } from './registry/domain-registry.service';
import { PlatformAccessModule } from '../platform-access/platform-access.module';
import { InvoicesModule } from '../finance/invoices/invoices.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [InvoicesModule, ExpensesModule, TasksModule, AuditModule, PlatformAccessModule],
  controllers: [DomainOperationController, ClientServicesController],
  providers: [
    ClientServicesService,
    DomainOperationService,
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
