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

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('applies projectId filter', async () => {
      await service.findAll({ projectId: 'proj-1' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('applies companyId filter on product then project default', async () => {
      await service.findAll({ companyId: 'comp-1' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { companyId: 'comp-1' },
              { companyId: null, project: { is: { companyId: 'comp-1' } } },
            ],
            project: { trashedAt: null },
          }),
        }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies canonical lifecycle filters', async () => {
      await service.findAll({
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
        deliveryResolution: 'DONE',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deliveryStage: 'QA',
            deliveryWorkStatus: 'ON_HOLD',
            deliveryResolution: 'DONE',
          }),
        }),
      );
    });

    it('applies productType filter', async () => {
      await service.findAll({ productType: 'COMPANY_WEBSITE' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productType: 'COMPANY_WEBSITE' }),
        }),
      );
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'site' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'site', mode: 'insensitive' } },
              { project: { name: { contains: 'site', mode: 'insensitive' } } },
              { project: { company: { name: { contains: 'site', mode: 'insensitive' } } } },
            ]),
          }),
        }),
      );
    });

    it('applies product hubView as AND', async () => {
      await service.findAll({ hubView: 'delivery' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.objectContaining({
                deliveryResolution: null,
                status: { notIn: ['DONE', 'LOST'] },
              }),
            ],
          }),
        }),
      );
    });

    it('omits live-subscription include on generic lists', async () => {
      await service.findAll({});
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.not.objectContaining({
            subscriptions: expect.anything(),
          }),
        }),
      );
    });

    it('includes live subscriptions when classifying hubView', async () => {
      await service.findAll({ includeHubView: true });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            subscriptions: expect.objectContaining({ take: 1 }),
          }),
        }),
      );
    });

    it('attaches hubView and strips subscriptions when classifying', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          status: 'DONE',
          deliveryResolution: 'DONE',
          subscriptions: [{ id: 'sub-1' }],
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ includeHubView: true });

      expect(result.items[0]).toEqual(
        expect.objectContaining({ id: 'p1', hubView: 'maintenance' }),
      );
      expect(result.items[0]).not.toHaveProperty('subscriptions');
    });

    it('does not attach hubView on generic lists', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          status: 'DONE',
          deliveryResolution: 'DONE',
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.items[0]).not.toHaveProperty('hubView');
    });
  });
});
