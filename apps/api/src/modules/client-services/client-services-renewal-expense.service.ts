import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ClientServiceFlowsService } from './client-service-flows.service';
import {
  runClientServicesRenewalExpenses,
  type ClientServicesRenewalExpenseParams,
  type ClientServicesRenewalExpenseResult,
} from './client-services-renewal-expense';

@Injectable()
export class ClientServicesRenewalExpenseService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly flows: ClientServiceFlowsService,
  ) {}

  /** Idempotent daily pass: Expense cards at Invoice Paid or D−30, not at D−60 invoice create. */
  async runDueRenewalExpenses(
    params?: ClientServicesRenewalExpenseParams,
  ): Promise<ClientServicesRenewalExpenseResult> {
    return runClientServicesRenewalExpenses(this.prisma, this.flows, params);
  }
}
