import { describe, expect, it, vi } from 'vitest';
import { syncProductBonusPoolForPoolKey } from './bonus-pool-sync-trigger';

vi.mock('./product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn(),
}));

import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

describe('syncProductBonusPoolForPoolKey', () => {
  it('syncs every order in the pool scope', async () => {
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]),
      },
    };

    const result = await syncProductBonusPoolForPoolKey(prisma as never, 'product:p1');

    expect(result).toEqual({
      poolKey: 'product:p1',
      orderIds: ['o1', 'o2'],
      ordersSynced: 2,
    });
    expect(syncProductBonusPoolForOrder).toHaveBeenCalledTimes(2);
    expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'o1');
    expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'o2');
  });
});
