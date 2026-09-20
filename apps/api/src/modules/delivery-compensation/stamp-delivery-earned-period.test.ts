import { describe, expect, it, vi } from 'vitest';
import { DELIVERY_BONUS_SOURCE_V2 } from '@nbos/shared';
import {
  stampDeliveryEarnedPeriodAtFirstDone,
  stampDeliveryEarnedPeriodForExtension,
  stampDeliveryEarnedPeriodForProduct,
} from './stamp-delivery-earned-period';

function buildDb(count: number) {
  const updateMany = vi.fn().mockResolvedValue({ count });
  return { db: { bonusEntry: { updateMany } }, updateMany };
}

describe('stampDeliveryEarnedPeriodAtFirstDone', () => {
  it('stamps the Done month only on V2 entries without a period', async () => {
    const { db, updateMany } = buildDb(3);

    const stamped = await stampDeliveryEarnedPeriodAtFirstDone(db as never, {
      orderId: 'ord-1',
      doneAt: new Date('2026-09-19T21:30:00.000Z'),
    });

    expect(stamped).toBe(3);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'ord-1',
        deliverySource: DELIVERY_BONUS_SOURCE_V2,
        earnedPeriod: null,
      },
      data: { earnedPeriod: '2026-09' },
    });
  });

  it('uses the UTC month of the Done timestamp', async () => {
    const { db, updateMany } = buildDb(1);

    await stampDeliveryEarnedPeriodAtFirstDone(db as never, {
      orderId: 'ord-2',
      doneAt: new Date('2026-01-31T23:59:59.000Z'),
    });

    expect(updateMany.mock.calls[0]?.[0].data).toEqual({ earnedPeriod: '2026-01' });
  });

  it('is a no-op on a repeated Done when every entry already carries a period', async () => {
    const { db } = buildDb(0);

    const stamped = await stampDeliveryEarnedPeriodAtFirstDone(db as never, {
      orderId: 'ord-3',
      doneAt: new Date('2026-09-19T21:30:00.000Z'),
    });

    expect(stamped).toBe(0);
  });
});

describe('stampDeliveryEarnedPeriodForProduct', () => {
  it('resolves the order of the product and stamps inside the caller transaction', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const tx = {
      order: { findUnique: vi.fn().mockResolvedValue({ id: 'ord-9' }) },
      bonusEntry: { updateMany },
    };

    await expect(stampDeliveryEarnedPeriodForProduct(tx as never, 'prod-1')).resolves.toBe(2);
    expect(tx.order.findUnique).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
      select: { id: true },
    });
    expect(updateMany.mock.calls[0]?.[0].where).toMatchObject({
      orderId: 'ord-9',
      deliverySource: DELIVERY_BONUS_SOURCE_V2,
      earnedPeriod: null,
    });
  });

  it('does nothing for a product without a linked order', async () => {
    const updateMany = vi.fn();
    const tx = {
      order: { findUnique: vi.fn().mockResolvedValue(null) },
      bonusEntry: { updateMany },
    };

    await expect(stampDeliveryEarnedPeriodForProduct(tx as never, 'prod-2')).resolves.toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe('stampDeliveryEarnedPeriodForExtension', () => {
  it('resolves the order of the extension', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      order: { findFirst: vi.fn().mockResolvedValue({ id: 'ord-ext' }) },
      bonusEntry: { updateMany },
    };

    await expect(stampDeliveryEarnedPeriodForExtension(tx as never, 'ext-1')).resolves.toBe(1);
    expect(updateMany.mock.calls[0]?.[0].where).toMatchObject({ orderId: 'ord-ext' });
  });
});
