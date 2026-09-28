import { Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue, type LeadSourceEnum } from '@nbos/database';
import { decimalFrom } from './bonus-pool-decimal';
import { persistLockedCappedSalesBonusRows } from './sales-bonus-order-accrual-write';

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

  return persistLockedCappedSalesBonusRows({
    prisma: input.prisma,
    order: input.order,
    deal: input.order.deal,
    policy,
    baseAmount: decimalFrom(input.invoice.amount),
    snapshotJson: recurringSnapshot(input, policy),
    invoiceId: input.invoice.id,
    slotMode: null,
    earnedPeriod: input.earnedPeriod,
  });
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
