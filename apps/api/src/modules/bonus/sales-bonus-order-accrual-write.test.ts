import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { collectWritableCappedRows } from './sales-bonus-order-accrual-write';

const ORDER_ID = 'ord-cap-1';
const INVOICE_ID = 'inv-cap-1';
const SELLER_ID = 'emp-seller';
const ASSISTANT_ID = 'emp-asst';
const OVER_CAP_BASE = new Decimal('4000000');
const SELLER_PERCENT = new Decimal('8');
const ASSISTANT_PERCENT = new Decimal('2');

type BonusFindManyArgs = {
  where: { orderId: string; type: string; salesBonusSlot?: { not: null } };
  select: { salesBonusSlot: true };
};

function writeInput(overrides?: { slotMode?: 'slot' | null }) {
  return {
    prisma: {} as never,
    order: { id: ORDER_ID, projectId: 'proj-1' },
    deal: { id: 'deal-1', sellerId: SELLER_ID, sellerAssistantId: ASSISTANT_ID },
    policy: { sellerPercent: SELLER_PERCENT, assistantPercent: ASSISTANT_PERCENT },
    baseAmount: OVER_CAP_BASE,
    snapshotJson: { basis: 'ORDER_TOTAL' },
    invoiceId: INVOICE_ID,
    slotMode: overrides && 'slotMode' in overrides ? overrides.slotMode! : ('slot' as const),
    earnedPeriod: '2026-09',
  };
}

describe('collectWritableCappedRows missing-role remainder', () => {
  let aggregate: ReturnType<typeof vi.fn>;
  let findMany: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    aggregate = vi.fn();
    findMany = vi.fn();
    findFirst = vi.fn().mockResolvedValue(null);
  });

  function db() {
    return {
      bonusEntry: {
        aggregate,
        findMany,
        findFirst,
      },
    };
  }

  it('gives the leftover envelope to the missing assistant, not a fresh 80/20 of 60k', async () => {
    aggregate.mockResolvedValue({ _sum: { amount: new Decimal(240_000) } });
    findMany.mockImplementation(async (args: BonusFindManyArgs) => {
      expect(args.where.orderId).toBe(ORDER_ID);
      return [{ salesBonusSlot: 'SELLER' }];
    });

    const rows = await collectWritableCappedRows(db(), writeInput());

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        employeeId: ASSISTANT_ID,
        slot: 'ASSISTANT',
        amount: new Decimal(60_000),
        percent: ASSISTANT_PERCENT,
      }),
    );
    expect(rows[0]?.amount.plus(240_000).toString()).toBe('300000');
  });

  it('does not insert 12000 when seller already holds 240000 of the envelope', async () => {
    aggregate.mockResolvedValue({ _sum: { amount: new Decimal(240_000) } });
    findMany.mockResolvedValue([{ salesBonusSlot: 'SELLER' }]);

    const rows = await collectWritableCappedRows(db(), writeInput());

    expect(rows.map((row) => row.amount.toString())).toEqual(['60000']);
    expect(rows.map((row) => row.amount.toString())).not.toContain('12000');
  });

  it('still splits both missing roles against the remaining envelope', async () => {
    aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    findMany.mockResolvedValue([]);

    const rows = await collectWritableCappedRows(db(), writeInput());

    expect(rows.map((row) => row.amount.toString())).toEqual(['240000', '60000']);
  });

  it('gives recurring leftover to the missing assistant without re-splitting 80/20', async () => {
    aggregate.mockResolvedValue({ _sum: { amount: new Decimal(240_000) } });
    findFirst.mockResolvedValueOnce({ id: 'seller-recurring' }).mockResolvedValueOnce(null);

    const rows = await collectWritableCappedRows(db(), writeInput({ slotMode: null }));

    expect(findMany).not.toHaveBeenCalled();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        employeeId: ASSISTANT_ID,
        slot: 'ASSISTANT',
        amount: new Decimal(60_000),
      }),
    );
  });
});
