import { Logger } from '@nestjs/common';
import { Decimal, PrismaClient, type InputJsonValue, type LeadSourceEnum } from '@nbos/database';
import { decimalFrom } from './bonus-pool-decimal';
import {
  reportSalesAccrualHold,
  SALES_ACCRUAL_HOLD_REASON,
  type SalesAccrualHoldNotify,
} from './sales-bonus-accrual-hold';
import {
  hasSlottedSalesAccrualForInvoice,
  hasSlottedSalesBonusOnOrder,
} from './sales-bonus-accrual-idempotency';
import { firstProductInvoiceMinimumAmount } from './sales-bonus-combined-accrual';
import { persistLockedCappedSalesBonusRows } from './sales-bonus-order-accrual-write';
import { loadSalesBonusPolicyAtEvent } from './sales-bonus-policy-at-event';
import { classifyClassicSalesInvoicePurpose } from './sales-bonus-qualifying-invoice';

type ClassicDeal = {
  id: string;
  source: LeadSourceEnum;
  sellerId: string;
  sellerAssistantId: string | null;
};

type ClassicOrder = {
  id: string;
  projectId: string;
  totalAmount: Decimal;
  deal: ClassicDeal;
};

type ClassicInvoice = {
  id: string;
  amount: Decimal;
  type: string | null;
};

const CLASSIC_PAYMENT_MODEL = 'CLASSIC' as const;

export async function accrueClassicOneTimeSalesBonus(input: {
  prisma: InstanceType<typeof PrismaClient>;
  logger: Logger;
  notifyHold: SalesAccrualHoldNotify;
  invoice: ClassicInvoice;
  order: ClassicOrder;
  receiptAt: Date;
  earnedPeriod: string;
}): Promise<boolean> {
  const purpose = classifyClassicSalesInvoicePurpose(input.invoice.type);
  if (purpose === 'excluded') {
    return false;
  }
  if (purpose === 'ambiguous') {
    await reportSalesAccrualHold(input.logger, input.notifyHold, {
      reason: SALES_ACCRUAL_HOLD_REASON.AMBIGUOUS_INVOICE_PURPOSE,
      invoiceId: input.invoice.id,
      orderId: input.order.id,
      invoiceType: input.invoice.type,
    });
    return false;
  }
  if (await isLaterPaidInvoiceAfterAccrual(input.prisma, input.order.id, input.invoice.id)) {
    return false;
  }
  return persistClassicWave(input);
}

async function isLaterPaidInvoiceAfterAccrual(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
  invoiceId: string,
): Promise<boolean> {
  const onOrder = await hasSlottedSalesBonusOnOrder(prisma, orderId);
  if (!onOrder) {
    return false;
  }
  const onThisInvoice = await hasSlottedSalesAccrualForInvoice(prisma, orderId, invoiceId);
  return !onThisInvoice;
}

async function persistClassicWave(input: {
  prisma: InstanceType<typeof PrismaClient>;
  logger: Logger;
  notifyHold: SalesAccrualHoldNotify;
  invoice: ClassicInvoice;
  order: ClassicOrder;
  receiptAt: Date;
  earnedPeriod: string;
}): Promise<boolean> {
  const completingExisting = await hasSlottedSalesAccrualForInvoice(
    input.prisma,
    input.order.id,
    input.invoice.id,
  );
  const loaded = await loadSalesBonusPolicyAtEvent(input.prisma, {
    fromCategory: input.order.deal.source,
    paymentModel: CLASSIC_PAYMENT_MODEL,
    at: input.receiptAt,
  });
  if (loaded.status === 'ambiguous') {
    await reportSalesAccrualHold(input.logger, input.notifyHold, {
      reason: SALES_ACCRUAL_HOLD_REASON.AMBIGUOUS_SALES_POLICY,
      invoiceId: input.invoice.id,
      orderId: input.order.id,
      fromCategory: input.order.deal.source,
      paymentModel: CLASSIC_PAYMENT_MODEL,
    });
    return false;
  }
  if (loaded.status === 'missing') {
    await reportSalesAccrualHold(input.logger, input.notifyHold, {
      reason: SALES_ACCRUAL_HOLD_REASON.MISSING_SALES_POLICY,
      invoiceId: input.invoice.id,
      orderId: input.order.id,
      fromCategory: input.order.deal.source,
      paymentModel: CLASSIC_PAYMENT_MODEL,
    });
    return false;
  }
  if (!completingExisting && (await invoiceBelowCombinedMinimum(input, loaded.policy))) {
    return false;
  }
  return writeClassicRows(input, loaded.policy);
}

async function invoiceBelowCombinedMinimum(
  input: {
    logger: Logger;
    notifyHold: SalesAccrualHoldNotify;
    invoice: ClassicInvoice;
    order: ClassicOrder;
  },
  policy: { sellerPercent: Decimal; assistantPercent: Decimal },
): Promise<boolean> {
  const minimum = firstProductInvoiceMinimumAmount(
    input.order.totalAmount,
    policy.sellerPercent,
    policy.assistantPercent,
  );
  if (!decimalFrom(input.invoice.amount).lt(minimum)) {
    return false;
  }
  await reportSalesAccrualHold(input.logger, input.notifyHold, {
    reason: SALES_ACCRUAL_HOLD_REASON.INSUFFICIENT_INVOICE_AMOUNT,
    invoiceId: input.invoice.id,
    orderId: input.order.id,
    invoiceAmount: input.invoice.amount.toString(),
    minimumAmount: minimum.toString(),
  });
  return true;
}

function writeClassicRows(
  input: {
    prisma: InstanceType<typeof PrismaClient>;
    invoice: ClassicInvoice;
    order: ClassicOrder;
    receiptAt: Date;
    earnedPeriod: string;
  },
  policy: { sellerPercent: Decimal; assistantPercent: Decimal; effectiveFrom: Date },
): Promise<boolean> {
  const snapshot = {
    fromCategory: input.order.deal.source,
    paymentModel: CLASSIC_PAYMENT_MODEL,
    sellerPercent: Number(policy.sellerPercent),
    assistantPercent: Number(policy.assistantPercent),
    policyEffectiveFrom: policy.effectiveFrom.toISOString(),
    receiptEventAt: input.receiptAt.toISOString(),
    earnedPeriod: input.earnedPeriod,
    baseAmount: input.order.totalAmount.toString(),
    invoiceId: input.invoice.id,
    orderId: input.order.id,
    dealId: input.order.deal.id,
    basis: 'ORDER_TOTAL',
  } as InputJsonValue;
  return persistLockedCappedSalesBonusRows({
    prisma: input.prisma,
    order: input.order,
    deal: input.order.deal,
    policy,
    baseAmount: input.order.totalAmount,
    snapshotJson: snapshot,
    invoiceId: input.invoice.id,
    slotMode: 'slot',
    earnedPeriod: input.earnedPeriod,
  });
}
