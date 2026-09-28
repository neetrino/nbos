import { describe, expect, it, vi } from 'vitest';
import {
  lockSalesOrderAccrual,
  salesOrderAccrualLockKey,
  SALES_ORDER_ACCRUAL_LOCK_PREFIX,
} from './sales-bonus-order-accrual-lock';

describe('sales-bonus-order-accrual-lock', () => {
  it('namespaces the lock key with the order id', () => {
    expect(salesOrderAccrualLockKey('ord-1')).toBe(`${SALES_ORDER_ACCRUAL_LOCK_PREFIX}:ord-1`);
  });

  it('issues a parameterized transaction-scoped advisory lock', async () => {
    const tx = { $executeRaw: vi.fn().mockResolvedValue(1) };
    await lockSalesOrderAccrual(tx, 'ord-1');
    const chunks = tx.$executeRaw.mock.calls[0]?.[0] as { strings?: string[] } | string[];
    const sql = Array.isArray(chunks) ? chunks.join('?') : String(chunks);
    expect(sql).toMatch(/pg_advisory_xact_lock\(hashtext\(/);
    expect(sql).not.toMatch(/ord-1/);
    expect(tx.$executeRaw.mock.calls[0]?.[1]).toBe(`${SALES_ORDER_ACCRUAL_LOCK_PREFIX}:ord-1`);
  });
});
