import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  runClientServicesRenewalInvoices,
  type ClientServicesRenewalInvoiceParams,
  type ClientServicesRenewalInvoiceResult,
} from './client-services-renewal-invoice';
import { ClientServiceFlowsService } from './client-service-flows.service';

@Injectable()
export class ClientServicesRenewalInvoiceService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly flows: ClientServiceFlowsService,
  ) {}

  /** Idempotent daily pass: Invoice Cards for WE_PAY services within the renewal window. */
  async runDueRenewalInvoices(
    params?: ClientServicesRenewalInvoiceParams,
  ): Promise<ClientServicesRenewalInvoiceResult> {
    return runClientServicesRenewalInvoices(this.prisma, this.flows, params);
  }
}
