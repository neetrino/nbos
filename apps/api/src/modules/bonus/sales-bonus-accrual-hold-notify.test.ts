import { describe, expect, it, vi } from 'vitest';
import { notifyFinanceBonusViewersOfAccrualHold } from './sales-bonus-accrual-hold-notify';
import { SALES_ACCRUAL_HOLD_REASON } from './sales-bonus-accrual-hold';

describe('notifyFinanceBonusViewersOfAccrualHold', () => {
  it('notifies company-wide finance bonus viewers and keeps a deduped hold', async () => {
    const prisma = {
      employee: {
        findMany: vi.fn().mockResolvedValue([{ id: 'fin-1' }, { id: 'fin-2' }]),
      },
    };
    const notifications = { createMany: vi.fn().mockResolvedValue({ inserted: 2 }) };

    await notifyFinanceBonusViewersOfAccrualHold(prisma as never, notifications, {
      reason: SALES_ACCRUAL_HOLD_REASON.MISSING_SALES_POLICY,
      invoiceId: 'inv-1',
      orderId: 'ord-1',
    });

    expect(notifications.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientIds: ['fin-1', 'fin-2'],
        type: 'sales_bonus.accrual_held',
        sourceModule: 'bonus',
        entityId: 'inv-1',
        dedupeKeyPrefix: 'sales_bonus.accrual_held',
        dedupeKeySuffix: 'MISSING_SALES_POLICY:inv-1',
      }),
    );
  });
});
