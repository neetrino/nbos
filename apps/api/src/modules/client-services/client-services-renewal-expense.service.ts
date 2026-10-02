import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { runWePayRenewalExpenses } from './client-services-we-pay-expense';
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

  /**
   * Idempotent daily pass.
   * Client Charge: Expense at Invoice Paid or D−30, not at D−60 invoice create.
   * We Pay: Expense at D−30 with no invoice.
   */
  async runDueRenewalExpenses(
    params?: ClientServicesRenewalExpenseParams,
  ): Promise<ClientServicesRenewalExpenseResult> {
    const clientCharge = await runClientServicesRenewalExpenses(this.prisma, this.flows, params);
    const wePay = await runWePayRenewalExpenses(this.prisma, this.flows, params);
    return combineRenewalExpenseResults(clientCharge, wePay);
  }
}

function combineRenewalExpenseResults(
  first: ClientServicesRenewalExpenseResult,
  second: ClientServicesRenewalExpenseResult,
): ClientServicesRenewalExpenseResult {
  return {
    asOf: first.asOf,
    eligibleCount: first.eligibleCount + second.eligibleCount,
    skippedExisting: first.skippedExisting + second.skippedExisting,
    created: [...first.created, ...second.created],
    failures: [...first.failures, ...second.failures],
  };
}
