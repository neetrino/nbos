import type { TransactionClient } from '@nbos/database';

export const SALES_ORDER_ACCRUAL_LOCK_PREFIX = 'sales-bonus-order-accrual';

type SalesOrderAccrualLockDb = Pick<TransactionClient, '$executeRaw'>;

/** Transaction-scoped advisory lock key for one order's Sales accrual envelope. */
export function salesOrderAccrualLockKey(orderId: string): string {
  return `${SALES_ORDER_ACCRUAL_LOCK_PREFIX}:${orderId}`;
}

/**
 * Serialize remaining-cap reads and inserts for one order. Parameterized; no
 * string-concat SQL. Must run inside the same transaction as the sum and writes.
 */
export async function lockSalesOrderAccrual(
  tx: SalesOrderAccrualLockDb,
  orderId: string,
): Promise<void> {
  const key = salesOrderAccrualLockKey(orderId);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
