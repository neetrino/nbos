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
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cp1',
            baseSalary: { toString: () => '0' },
            currency: 'AMD',
            kpiPolicyId: 'kp1',
          },
        ]),
      },
      kpiResult: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ planAmount: new Decimal(1000), actualAmount: new Decimal(600) }]),
      },
    };

    const ok = await applyPayableSnapshotToSalesEntry(db as never, 'be1');

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: new Decimal('0.5'),
        payableAmount: new Decimal('50.00'),
        kpiGatePassed: true,
      },
    });
  });
});
