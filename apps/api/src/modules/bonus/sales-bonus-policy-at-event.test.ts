import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { loadSalesBonusPolicyAtEvent } from './sales-bonus-policy-at-event';

const AT = new Date('2026-02-10T12:00:00.000Z');

describe('loadSalesBonusPolicyAtEvent', () => {
  it('uses the version covering the receipt, not a later published row', async () => {
    const covering = {
      sellerPercent: 10,
      assistantPercent: 2,
      effectiveFrom: new Date('2026-02-10T00:00:00.000Z'),
      effectiveTo: new Date('2026-02-15T00:00:00.000Z'),
      isActive: false,
    };
    const later = {
      sellerPercent: 12,
      assistantPercent: 3,
      effectiveFrom: new Date('2026-02-15T00:00:00.000Z'),
      effectiveTo: null,
      isActive: true,
    };
    const db = {
      salesBonusPolicy: { findMany: vi.fn().mockResolvedValue([covering, later]) },
    };

    const loaded = await loadSalesBonusPolicyAtEvent(db, {
      fromCategory: 'SALES',
      paymentModel: 'CLASSIC',
      at: AT,
    });

    expect(loaded.status).toBe('found');
    if (loaded.status === 'found') {
      expect(loaded.policy.sellerPercent).toEqual(new Decimal(10));
      expect(loaded.policy.assistantPercent).toEqual(new Decimal(2));
    }
    expect(db.salesBonusPolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          effectiveFrom: { lte: AT },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: AT } }],
        }),
      }),
    );
    expect(db.salesBonusPolicy.findMany.mock.calls[0]?.[0]?.where.isActive).toBeUndefined();
  });

  it('does not select a zero-length inactive legacy window for a later receipt', async () => {
    const started = new Date('2020-01-01T00:00:00.000Z');
    const db = {
      salesBonusPolicy: {
        findMany: vi.fn().mockResolvedValue([
          {
            sellerPercent: 10,
            assistantPercent: 2,
            effectiveFrom: started,
            effectiveTo: started,
            isActive: false,
          },
        ]),
      },
    };

    await expect(
      loadSalesBonusPolicyAtEvent(db, {
        fromCategory: 'SALES',
        paymentModel: 'CLASSIC',
        at: AT,
      }),
    ).resolves.toEqual({ status: 'missing' });
  });

  it('holds when two open versions overlap the receipt', async () => {
    const tied = {
      sellerPercent: 10,
      assistantPercent: 2,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
    };
    const db = {
      salesBonusPolicy: { findMany: vi.fn().mockResolvedValue([tied, { ...tied }]) },
    };

    await expect(
      loadSalesBonusPolicyAtEvent(db, {
        fromCategory: 'SALES',
        paymentModel: 'CLASSIC',
        at: AT,
      }),
    ).resolves.toEqual({ status: 'ambiguous' });
  });
});
