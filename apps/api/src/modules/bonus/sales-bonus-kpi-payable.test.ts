import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import { applyPayableSnapshotToSalesEntry } from './sales-bonus-kpi-payable';

describe('applyPayableSnapshotToSalesEntry', () => {
  it('snapshots EARNED Sales entry skipped by open-entry refresh', async () => {
    const update = vi.fn().mockResolvedValue({});
    const db = {
      bonusEntry: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'be1',
          type: 'SALES',
          employeeId: 'e1',
          amount: new Decimal(100),
          earnedPeriod: '2026-05',
          payableAmount: null,
          kpiPayoutFactor: null,
          payableAdjustment: new Decimal(0),
        }),
        update,
      },
      compensationProfile: {
        findFirst: vi.fn().mockResolvedValue({ kpiPolicyId: 'kp1' }),
      },
      kpiResult: {
        findFirst: vi.fn().mockResolvedValue({ payoutFactor: new Decimal('0.8') }),
      },
    };

    const ok = await applyPayableSnapshotToSalesEntry(db as never, 'be1');

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: new Decimal('0.8'),
        payableAmount: new Decimal('80.00'),
        kpiGatePassed: true,
      },
    });
  });
});
