import { describe, expect, it, vi } from 'vitest';

import {
  hasRecurringSalesAccrualForInvoiceEmployee,
  hasSalesAccrualForInvoice,
  hasSlottedSalesAccrualForInvoice,
  hasSlottedSalesBonusOnOrder,
} from './sales-bonus-accrual-idempotency';

describe('sales-bonus-accrual-idempotency', () => {
  it('hasSalesAccrualForInvoice returns true when row exists', async () => {
    const db = {
      bonusEntry: { findFirst: vi.fn().mockResolvedValue({ id: 'b1' }) },
    };
    await expect(hasSalesAccrualForInvoice(db as never, 'ord1', 'inv1')).resolves.toBe(true);
  });

  it('hasSlottedSalesBonusOnOrder checks slotted rows', async () => {
    const db = {
      bonusEntry: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    await hasSlottedSalesBonusOnOrder(db as never, 'ord1');
    expect(db.bonusEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ salesBonusSlot: { not: null } }),
      }),
    );
  });

  it('hasSlottedSalesAccrualForInvoice requires a slot on this invoice', async () => {
    const db = {
      bonusEntry: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    await hasSlottedSalesAccrualForInvoice(db as never, 'ord1', 'inv2');
    expect(db.bonusEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          salesAccrualInvoiceId: 'inv2',
          salesBonusSlot: { not: null },
        }),
      }),
    );
  });

  it('hasRecurringSalesAccrualForInvoiceEmployee scopes by employee', async () => {
    const db = {
      bonusEntry: { findFirst: vi.fn().mockResolvedValue({ id: 'b1' }) },
    };
    await hasRecurringSalesAccrualForInvoiceEmployee(db as never, 'ord1', 'inv2', 'e1');
    expect(db.bonusEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employeeId: 'e1', salesAccrualInvoiceId: 'inv2' }),
      }),
    );
  });
});
