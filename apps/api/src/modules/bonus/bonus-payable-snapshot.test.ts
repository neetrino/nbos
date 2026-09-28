import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import {
  applyPayableSnapshotToBonusEntry,
  computeAutoPayable,
  computePayableAmount,
} from './bonus-payable-snapshot';

const EXAMPLE_PLAN = new Decimal('1500000');
const SALES_GROSS = new Decimal('200000');

function snapshotDb(params: {
  type: string;
  amount: Decimal;
  earnedPeriod: string | null;
  kpiRows?: Array<{ planAmount: Decimal | null; actualAmount: Decimal | null }>;
  hasPolicy?: boolean;
}) {
  const update = vi.fn().mockResolvedValue({});
  const create = vi.fn();
  return {
    update,
    create,
    db: {
      bonusEntry: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'be1',
          type: params.type,
          employeeId: 'e1',
          amount: params.amount,
          earnedPeriod: params.earnedPeriod,
          payableAdjustment: new Decimal(0),
        }),
        update,
      },
      compensationProfile: {
        findMany: vi.fn().mockResolvedValue(
          params.hasPolicy === false
            ? []
            : [
                {
                  id: 'cp1',
                  baseSalary: { toString: () => '0' },
                  currency: 'AMD',
                  kpiPolicyId: 'kp1',
                },
              ],
        ),
      },
      kpiResult: {
        findMany: vi.fn().mockResolvedValue(params.kpiRows ?? []),
        create,
      },
    },
  };
}

describe('bonus payable snapshot math', () => {
  it('computes auto payable from amount and factor', () => {
    expect(computeAutoPayable(new Decimal(100_000), new Decimal('0.7')).toString()).toBe('70000');
  });

  it('adds manual adjustment to auto payable', () => {
    expect(computePayableAmount(new Decimal(70_000), new Decimal(20_000)).toString()).toBe('90000');
  });

  it('clamps payable to zero when adjustment is deeply negative', () => {
    expect(computePayableAmount(new Decimal(10_000), new Decimal(-50_000)).isZero()).toBe(true);
  });
});

describe('applyPayableSnapshotToBonusEntry Sales hold', () => {
  it('does not snapshot a full or zero-performance payable when KpiResult is missing', async () => {
    const { db, update } = snapshotDb({
      type: 'SALES',
      amount: SALES_GROSS,
      earnedPeriod: '2026-03',
      kpiRows: [],
    });

    const ok = await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: null,
        payableAmount: null,
        kpiGatePassed: null,
      },
    });
  });

  it('holds when the stored plan is missing', async () => {
    const { db, update } = snapshotDb({
      type: 'SALES',
      amount: SALES_GROSS,
      earnedPeriod: '2026-03',
      kpiRows: [{ planAmount: null, actualAmount: new Decimal('1050000') }],
    });

    await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: null,
        payableAmount: null,
        kpiGatePassed: null,
      },
    });
  });

  it('treats plan 1,500,000 and actual 0 as real zero performance', async () => {
    const { db, update } = snapshotDb({
      type: 'SALES',
      amount: SALES_GROSS,
      earnedPeriod: '2026-03',
      kpiRows: [{ planAmount: EXAMPLE_PLAN, actualAmount: new Decimal(0) }],
    });

    await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: new Decimal(0),
        payableAmount: new Decimal('0.00'),
        kpiGatePassed: false,
      },
    });
  });

  it('does not pick a factor when two results exist for the same month', async () => {
    const { db, update } = snapshotDb({
      type: 'SALES',
      amount: SALES_GROSS,
      earnedPeriod: '2026-03',
      kpiRows: [
        { planAmount: EXAMPLE_PLAN, actualAmount: new Decimal('1050000') },
        { planAmount: new Decimal('3000000'), actualAmount: new Decimal('1500000') },
      ],
    });

    await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(update.mock.calls[0]?.[0].data.payableAmount).toBeNull();
    expect(update.mock.calls[0]?.[0].data.kpiPayoutFactor).toBeNull();
  });

  it('leaves Delivery payable at the full amount when there is no KPI', async () => {
    const { db, update } = snapshotDb({
      type: 'DELIVERY',
      amount: new Decimal('100'),
      earnedPeriod: '2026-03',
      hasPolicy: false,
      kpiRows: [],
    });

    await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: {
        kpiPayoutFactor: new Decimal(1),
        payableAmount: new Decimal('100.00'),
        kpiGatePassed: true,
      },
    });
  });

  it('replay of the snapshot does not create a second KpiResult', async () => {
    const { db, create } = snapshotDb({
      type: 'SALES',
      amount: SALES_GROSS,
      earnedPeriod: '2026-03',
      kpiRows: [{ planAmount: EXAMPLE_PLAN, actualAmount: new Decimal('1050000') }],
    });

    await applyPayableSnapshotToBonusEntry(db as never, 'be1');
    await applyPayableSnapshotToBonusEntry(db as never, 'be1');

    expect(create).not.toHaveBeenCalled();
  });
});
