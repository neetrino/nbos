import { describe, expect, it, vi } from 'vitest';
import { copyDealQuoteExtras } from './copy-deal-quote-extras';

describe('copyDealQuoteExtras', () => {
  it('copies only extras that the configuration does not already hold', async () => {
    const createMany = vi.fn();
    const db = {
      order: { findFirst: vi.fn().mockResolvedValue({ dealId: 'deal-1' }) },
      deliveryDealQuote: {
        findUnique: vi.fn().mockResolvedValue({
          items: [
            { functionId: 'fn-1', tierId: null },
            { functionId: 'fn-2', tierId: 'tier-1' },
          ],
        }),
      },
      deliveryConfigurationFeature: {
        findMany: vi.fn().mockResolvedValue([{ functionId: 'fn-1' }]),
        createMany,
      },
    };

    await copyDealQuoteExtras(db as never, 'prod-1', 'cfg-1', 'order-1');

    expect(db.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1', productId: 'prod-1', dealId: { not: null } },
      select: { dealId: true },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          configurationId: 'cfg-1',
          functionId: 'fn-2',
          tierId: 'tier-1',
          origin: 'EXTRA',
        },
      ],
    });
  });

  it('does nothing when the product has no deal quote', async () => {
    const createMany = vi.fn();
    const db = {
      order: { findFirst: vi.fn().mockResolvedValue(null) },
      deliveryDealQuote: { findUnique: vi.fn() },
      deliveryConfigurationFeature: { findMany: vi.fn(), createMany },
    };

    await copyDealQuoteExtras(db as never, 'prod-1', 'cfg-1');

    expect(createMany).not.toHaveBeenCalled();
  });
});
