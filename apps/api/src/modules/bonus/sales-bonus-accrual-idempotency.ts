import { Decimal, type TransactionClient } from '@nbos/database';

import { decimalFrom } from './bonus-pool-decimal';
import { SALES_BONUS_TYPE } from './sales-bonus-accrual-rows';

export type AccrualIdempotencyDb = Pick<TransactionClient, 'bonusEntry'>;

/** Any SALES row already tied to this paid invoice (replay guard before slotted wave exists). */
export async function hasSalesAccrualForInvoice(
  db: AccrualIdempotencyDb,
  orderId: string,
  invoiceId: string,
): Promise<boolean> {
  const row = await db.bonusEntry.findFirst({
    where: {
      orderId,
      type: SALES_BONUS_TYPE,
      salesAccrualInvoiceId: invoiceId,
    },
    select: { id: true },
  });
  return row != null;
}

/** Classic / subscription first-month wave already recorded for the order. */
export async function hasSlottedSalesBonusOnOrder(
  db: AccrualIdempotencyDb,
  orderId: string,
): Promise<boolean> {
  const row = await db.bonusEntry.findFirst({
    where: { orderId, type: SALES_BONUS_TYPE, salesBonusSlot: { not: null } },
    select: { id: true },
  });
  return row != null;
}

/** First-month Seller/Assistant row already tied to this invoice. Ignores unslotted recurring. */
export async function hasSlottedSalesAccrualForInvoice(
  db: AccrualIdempotencyDb,
  orderId: string,
  invoiceId: string,
): Promise<boolean> {
  const row = await db.bonusEntry.findFirst({
    where: {
      orderId,
      type: SALES_BONUS_TYPE,
      salesAccrualInvoiceId: invoiceId,
      salesBonusSlot: { not: null },
    },
    select: { id: true },
  });
  return row != null;
}

/**
 * Subscription recurring row for this invoice + employee + unslotted role.
 * A legacy unslotted row with a null role already counts as that employee's accrual.
 */
export async function hasRecurringSalesAccrualForInvoiceEmployee(
  db: AccrualIdempotencyDb,
  orderId: string,
  invoiceId: string,
  employeeId: string,
  role: 'SELLER' | 'ASSISTANT',
): Promise<boolean> {
  const row = await db.bonusEntry.findFirst({
    where: {
      orderId,
      type: SALES_BONUS_TYPE,
      salesAccrualInvoiceId: invoiceId,
      employeeId,
      salesBonusSlot: null,
      OR: [{ salesAccrualRole: role }, { salesAccrualRole: null }],
    },
    select: { id: true },
  });
  return row != null;
}

/** Every SALES amount already stored on the order, including null invoice ids. */
export async function sumSalesAccrualOnOrder(
  db: AccrualIdempotencyDb,
  orderId: string,
): Promise<Decimal> {
  const agg = await db.bonusEntry.aggregate({
    where: { orderId, type: SALES_BONUS_TYPE },
    _sum: { amount: true },
  });
  return decimalFrom(agg._sum.amount);
}

/**
 * Stored SALES amounts on the order except rows tied to the accruing invoice.
 * Null invoice ids are included; PostgreSQL `NOT invoiceId` would drop them.
 */
export async function sumSalesAccrualOnOrderExcludingInvoice(
  db: AccrualIdempotencyDb,
  orderId: string,
  invoiceId: string,
): Promise<Decimal> {
  const agg = await db.bonusEntry.aggregate({
    where: {
      orderId,
      type: SALES_BONUS_TYPE,
      OR: [{ salesAccrualInvoiceId: null }, { salesAccrualInvoiceId: { not: invoiceId } }],
    },
    _sum: { amount: true },
  });
  return decimalFrom(agg._sum.amount);
}
