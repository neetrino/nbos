import type { PrismaClient } from '@nbos/database';

import { SALES_BONUS_TYPE } from './sales-bonus-accrual-rows';

type AccrualIdempotencyDb = Pick<PrismaClient, 'bonusEntry'>;

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

/** Subscription recurring row for this invoice + employee. */
export async function hasRecurringSalesAccrualForInvoiceEmployee(
  db: AccrualIdempotencyDb,
  orderId: string,
  invoiceId: string,
  employeeId: string,
): Promise<boolean> {
  const row = await db.bonusEntry.findFirst({
    where: {
      orderId,
      type: SALES_BONUS_TYPE,
      salesAccrualInvoiceId: invoiceId,
      employeeId,
    },
    select: { id: true },
  });
  return row != null;
}
