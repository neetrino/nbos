import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import {
  patchBonusEntryPlannedAmount,
  resolvePlannedAmountFields,
} from './patch-bonus-entry-planned-amount';

const SALES_ENTRY = {
  id: 'be1',
  amount: new Decimal(400_000),
  originalAmount: null,
  title: 'Seller bonus',
  projectId: 'p1',
  orderId: 'o1',
  employeeId: 'e1',
  type: 'SALES',
  earnedPeriod: '2026-03',
  deliverySource: null,
};

describe('resolvePlannedAmountFields', () => {
  it('sets originalAmount from current when first edit', () => {
    const current = new Decimal('100');
    const next = new Decimal('120');
    const result = resolvePlannedAmountFields(current, next, null);
    expect(result.amount.toFixed(2)).toBe('120.00');
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });

  it('keeps existing originalAmount on subsequent edits', () => {
    const result = resolvePlannedAmountFields(
      new Decimal('120'),
      new Decimal('90'),
      new Decimal('100'),
    );
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });
});

describe('patchBonusEntryPlannedAmount Sales payable', () => {
  it('rolls back 400000 → 200000 when ordinary releases exceed the new payable', async () => {
    const prisma = createMockPrisma();
    prisma.bonusRelease.count.mockResolvedValue(0);
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(200_000) } });
    prisma.compensationProfile.findMany.mockResolvedValue([
      {
        id: 'cp1',
        baseSalary: { toString: () => '0' },
        currency: 'AMD',
        kpiPolicyId: 'kp1',
      },
    ]);
    prisma.kpiResult.findMany.mockResolvedValue([
      { planAmount: new Decimal(400_000), actualAmount: new Decimal(200_000) },
    ]);
    prisma.bonusEntry.findUnique.mockImplementation(
      (args: { select?: Record<string, unknown> }) => {
        if (args.select?.payableAmount && args.select.amount == null) {
          return Promise.resolve({ payableAmount: new Decimal(100_000) });
        }
        if (args.select?.payableAdjustment) {
          return Promise.resolve({
            id: 'be1',
            type: 'SALES',
            employeeId: 'e1',
            amount: new Decimal(200_000),
            earnedPeriod: '2026-03',
            payableAdjustment: new Decimal(0),
          });
        }
        return Promise.resolve(SALES_ENTRY);
      },
    );

    await expect(
      patchBonusEntryPlannedAmount(prisma as never, {
        bonusEntryId: 'be1',
        amount: '200000',
        reason: 'reduce plan',
      }),
    ).rejects.toThrow(/ordinary releases exceed the Sales KPI payable/);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it('allows a Delivery planned-amount cut down to already released', async () => {
    const prisma = createMockPrisma();
    prisma.bonusRelease.count.mockResolvedValue(0);
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(200_000) } });
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.bonusEntry.findUnique.mockImplementation(
      (args: { select?: Record<string, unknown> }) => {
        if (args.select?.payableAdjustment) {
          return Promise.resolve({
            id: 'be1',
            type: 'DELIVERY',
            employeeId: 'e1',
            amount: new Decimal(200_000),
            earnedPeriod: '2026-03',
            payableAdjustment: new Decimal(0),
          });
        }
        return Promise.resolve({ ...SALES_ENTRY, type: 'DELIVERY' });
      },
    );

    const out = await patchBonusEntryPlannedAmount(prisma as never, {
      bonusEntryId: 'be1',
      amount: '200000',
      reason: 'reduce delivery plan',
    });

    expect(out.nextAmount).toBe('200000.00');
    expect(out.previousAmount).toBe('400000.00');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
