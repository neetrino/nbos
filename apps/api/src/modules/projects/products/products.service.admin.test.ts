import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
  });

  describe('delete', () => {
    it('rejects hard delete with conflict', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      await expect(service.delete('p1')).rejects.toMatchObject({ status: 409 });
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats without filter', async () => {
      prisma.product.count.mockResolvedValue(5);
      const stats = await service.getStats();
      expect(stats.total).toBe(5);
    });

    it('returns stats with projectId filter', async () => {
      prisma.product.count.mockResolvedValue(2);
      const stats = await service.getStats('proj-1');
      expect(stats.total).toBe(2);
    });
  });
});
