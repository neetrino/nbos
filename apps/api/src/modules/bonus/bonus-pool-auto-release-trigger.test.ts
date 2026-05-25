import { describe, expect, it, vi } from 'vitest';
import { triggerPoolProportionalAutoRelease } from './bonus-pool-auto-release-trigger';

vi.mock('./product-bonus-pool-auto-release', () => ({
  tryCreateProportionalAutoReleases: vi.fn(),
}));

vi.mock('./product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn(),
}));

vi.mock('./order-received-payments-sum', () => ({
  sumPaymentsReceivedForOrder: vi.fn().mockResolvedValue({ toFixed: () => '100' }),
}));

import { tryCreateProportionalAutoReleases } from './product-bonus-pool-auto-release';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

describe('triggerPoolProportionalAutoRelease', () => {
  it('returns releasesCreated false when no orders match', async () => {
    const prisma = {
      order: { findMany: vi.fn().mockResolvedValue([]) },
      bonusRelease: { aggregate: vi.fn() },
    } as unknown as Parameters<typeof triggerPoolProportionalAutoRelease>[0];

    const result = await triggerPoolProportionalAutoRelease(prisma, 'product:p1');
    expect(result.releasesCreated).toBe(false);
    expect(result.ordersProcessed).toBe(0);
  });

  it('syncs pool when auto release inserts rows', async () => {
    vi.mocked(tryCreateProportionalAutoReleases).mockResolvedValueOnce(true);
    const prisma = {
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o1',
            projectId: 'prj',
            productId: 'prod',
            extensionId: null,
            product: { status: 'DONE' },
            extension: null,
          },
        ]),
      },
      bonusRelease: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
      },
    } as unknown as Parameters<typeof triggerPoolProportionalAutoRelease>[0];

    const result = await triggerPoolProportionalAutoRelease(prisma, 'product:prod');
    expect(result.releasesCreated).toBe(true);
    expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'o1');
  });
});
