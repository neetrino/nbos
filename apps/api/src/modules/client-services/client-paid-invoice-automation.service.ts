import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  runClientPaidInvoicePaidAutomation,
  type ClientPaidInvoiceAutomationParams,
  type ClientPaidInvoiceAutomationResult,
} from './client-paid-invoice-automation';
import { ClientServiceFlowsService } from './client-service-flows.service';

@Injectable()
export class ClientPaidInvoiceAutomationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly flows: ClientServiceFlowsService,
  ) {}

  /** Idempotent follow-up when a client-service invoice becomes fully paid. */
  async onInvoiceFullyPaid(
    params: ClientPaidInvoiceAutomationParams,
  ): Promise<ClientPaidInvoiceAutomationResult> {
    return runClientPaidInvoicePaidAutomation(this.prisma, this.flows, params);
  }
}
