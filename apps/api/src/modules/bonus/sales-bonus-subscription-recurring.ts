import { Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue, type LeadSourceEnum } from '@nbos/database';
import { decimalFrom } from './bonus-pool-decimal';
import { hasRecurringSalesAccrualForInvoiceEmployee } from './sales-bonus-accrual-idempotency';
import { buildSalesBonusAmountRows, persistSalesBonusRows } from './sales-bonus-accrual-rows';
import type { SalesBonusAmountRow } from './sales-bonus-accrual-rows';

type RecurringDeal = {
  id: string;
  source: LeadSourceEnum;
  sellerId: string;
  sellerAssistantId: string | null;
};

type RecurringOrder = {
  id: string;
  projectId: string;
  deal: RecurringDeal;
};

type SalesBonusPolicy = { sellerPercent: Decimal; assistantPercent: Decimal };

/**
 * Month 2+ of a subscription. Base stays the paid invoice amount; rates come from
 * `SUBSCRIPTION_RECURRING`, which is separate from the first-month one-month base.
 */
export async function accrueSubscriptionRecurringSalesBonus(input: {
  prisma: InstanceType<typeof PrismaClient>;
  logger: Logger;
  invoice: { id: string; amount: Decimal };
  order: RecurringOrder;
  earnedPeriod: string;
  loadPolicy: (
    fromCategory: LeadSourceEnum,
    paymentModel: 'SUBSCRIPTION_RECURRING',
  ) => Promise<SalesBonusPolicy | null>;
}): Promise<boolean> {
  const policy = await input.loadPolicy(input.order.deal.source, 'SUBSCRIPTION_RECURRING');
  if (!policy) {
    input.logger.warn(
      {
        from: input.order.deal.source,
        paymentModel: 'SUBSCRIPTION_RECURRING',
        dealId: input.order.deal.id,
      },
      'No active sales bonus policy row',
    );
    return false;
  }
  if (policy.sellerPercent.eq(0) && policy.assistantPercent.eq(0)) {
    return false;
  }

  const rowsToCreate = await rowsMissingForInvoice(input, policy);
  if (rowsToCreate.length === 0) {
    return false;
  }

  return persistSalesBonusRows(
    input.prisma,
    input.order,
    input.order.deal,
    rowsToCreate,
    recurringSnapshot(input, policy),
    input.invoice.id,
    null,
    input.earnedPeriod,
  );
}

function recurringSnapshot(
  input: { invoice: { id: string; amount: Decimal }; order: RecurringOrder },
  policy: SalesBonusPolicy,
): InputJsonValue {
  const baseAmount = decimalFrom(input.invoice.amount);
  return {
    fromCategory: input.order.deal.source,
    paymentModel: 'SUBSCRIPTION_RECURRING',
    sellerPercent: Number(policy.sellerPercent),
    assistantPercent: Number(policy.assistantPercent),
    baseAmount: baseAmount.toString(),
    invoiceId: input.invoice.id,
    orderId: input.order.id,
    dealId: input.order.deal.id,
    basis: 'SUBSCRIPTION_RECURRING_INVOICE',
  };
}

async function rowsMissingForInvoice(
  input: {
    prisma: InstanceType<typeof PrismaClient>;
    invoice: { id: string; amount: Decimal };
    order: RecurringOrder;
  },
  policy: SalesBonusPolicy,
): Promise<SalesBonusAmountRow[]> {
  const baseAmount = decimalFrom(input.invoice.amount);
  const rows = buildSalesBonusAmountRows(input.order.deal, policy, baseAmount);
  const missing: SalesBonusAmountRow[] = [];
  for (const row of rows) {
    const exists = await hasRecurringSalesAccrualForInvoiceEmployee(
      input.prisma,
      input.order.id,
      input.invoice.id,
      row.employeeId,
    );
    if (!exists) {
      missing.push(row);
    }
  }
  return missing;
}
