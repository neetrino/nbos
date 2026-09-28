import { BadRequestException } from '@nestjs/common';
import { Decimal, PrismaClient, type LeadSourceEnum } from '@nbos/database';
import { decimalFrom } from '../../bonus/bonus-pool-decimal';
import { firstProductInvoiceMinimumAmount } from '../../bonus/sales-bonus-combined-accrual';
import { loadSalesBonusPolicyAtEvent } from '../../bonus/sales-bonus-policy-at-event';
import {
  isQualifyingProductInvoiceType,
  QUALIFYING_PRODUCT_INVOICE_TYPES,
} from '../../bonus/sales-bonus-qualifying-invoice';

export interface FirstInvoiceMinimumCheckInput {
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  type?: string;
  excludeInvoiceId?: string;
}

/**
 * First qualifying product invoice must cover combined capped Seller+Assistant accrual.
 * Skip only when another non-cancelled qualifying sibling already meets the current minimum.
 */
export async function assertFirstInvoiceMinimums(
  prisma: InstanceType<typeof PrismaClient>,
  data: FirstInvoiceMinimumCheckInput,
): Promise<void> {
  await assertClassicFirstProductInvoiceSalesMinimum(prisma, data);
  await assertFirstSubscriptionPeriodMinimum(prisma, data);
}

async function assertClassicFirstProductInvoiceSalesMinimum(
  prisma: InstanceType<typeof PrismaClient>,
  data: FirstInvoiceMinimumCheckInput,
): Promise<void> {
  if (!data.orderId?.trim() || !isQualifyingProductInvoiceType(data.type ?? '')) {
    return;
  }
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: {
      paymentType: true,
      totalAmount: true,
      deal: { select: { source: true } },
    },
  });
  if (!order) {
    throw new BadRequestException(`Order ${data.orderId} not found`);
  }
  if (order.paymentType !== 'CLASSIC' || order.deal?.source == null) {
    return;
  }
  await assertAmountCoversCombinedSalesAccrual(prisma, {
    orderId: data.orderId,
    excludeInvoiceId: data.excludeInvoiceId,
    amount: data.amount,
    baseAmount: decimalFrom(order.totalAmount),
    fromCategory: order.deal.source,
  });
}

async function findQualifyingSiblingAmounts(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
  excludeInvoiceId?: string,
): Promise<Decimal[]> {
  const siblings = await prisma.invoice.findMany({
    where: {
      orderId,
      type: { in: [...QUALIFYING_PRODUCT_INVOICE_TYPES] },
      moneyStatus: { not: 'CANCELLED' },
      ...(excludeInvoiceId ? { id: { not: excludeInvoiceId } } : {}),
    },
    select: { amount: true },
  });
  return siblings.map((row) => decimalFrom(row.amount));
}

function siblingCoversMinimum(amounts: Decimal[], minimum: Decimal): boolean {
  return amounts.some((amount) => !amount.lt(minimum));
}

async function assertAmountCoversCombinedSalesAccrual(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    orderId: string;
    excludeInvoiceId?: string;
    amount: number;
    baseAmount: Decimal;
    fromCategory: LeadSourceEnum;
  },
): Promise<void> {
  const loaded = await loadSalesBonusPolicyAtEvent(prisma, {
    fromCategory: params.fromCategory,
    paymentModel: 'CLASSIC',
    at: new Date(),
  });
  if (loaded.status === 'ambiguous') {
    throw new BadRequestException(
      'Cannot save the first product invoice while two active Classic sales bonus policies share the same effective date',
    );
  }
  if (loaded.status === 'missing') {
    return;
  }
  const minimum = firstProductInvoiceMinimumAmount(
    params.baseAmount,
    loaded.policy.sellerPercent,
    loaded.policy.assistantPercent,
  );
  const siblings = await findQualifyingSiblingAmounts(
    prisma,
    params.orderId,
    params.excludeInvoiceId,
  );
  if (siblingCoversMinimum(siblings, minimum)) {
    return;
  }
  if (new Decimal(params.amount).lt(minimum)) {
    throw new BadRequestException(
      `First product invoice must be at least ${minimum.toString()} (combined Seller and Assistant sales accrual, capped at 300000 AMD)`,
    );
  }
}

async function assertFirstSubscriptionPeriodMinimum(
  prisma: InstanceType<typeof PrismaClient>,
  data: FirstInvoiceMinimumCheckInput,
): Promise<void> {
  if (!data.subscriptionId?.trim()) {
    return;
  }
  const subscription = await prisma.subscription.findUnique({
    where: { id: data.subscriptionId },
    select: { amount: true },
  });
  if (!subscription) {
    throw new BadRequestException(`Subscription ${data.subscriptionId} not found`);
  }
  const priorCount = await prisma.invoice.count({
    where: {
      subscriptionId: data.subscriptionId,
      moneyStatus: { not: 'CANCELLED' },
      ...(data.excludeInvoiceId ? { id: { not: data.excludeInvoiceId } } : {}),
    },
  });
  if (priorCount > 0) {
    return;
  }
  const minAmount = Number(subscription.amount);
  if (data.amount < minAmount) {
    throw new BadRequestException(
      `First subscription invoice must be at least the period amount (${minAmount})`,
    );
  }
}
