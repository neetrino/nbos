import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  createExtensionsServiceHarness,
  clearExtensionsServiceHarness,
  type ExtensionsServiceHarness,
} from './extensions.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

describe('ExtensionsService', () => {
  let service: ExtensionsServiceHarness['service'];
  let prisma: ExtensionsServiceHarness['prisma'];

  beforeEach(() => {
    const harness = createExtensionsServiceHarness();
    clearExtensionsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
  });

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('attaches readiness metadata', async () => {
      prisma.extension.findMany.mockResolvedValue([
        {
          id: 'e1',
          status: 'NEW',
          description: null,
          assignedTo: null,
          order: null,
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0]).toMatchObject({
        readiness: {
          isReadyForDevelopment: false,
          missing: [
            { field: 'description', message: expect.any(String) },
            { field: 'assignedTo', message: expect.any(String) },
          ],
        },
      });
    });

    it('applies projectId filter', async () => {
      await service.findAll({ projectId: 'proj-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('applies companyId filter on parent product then project default', async () => {
      await service.findAll({ companyId: 'comp-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { product: { is: { companyId: 'comp-1' } } },
              { product: { is: { companyId: null } }, project: { is: { companyId: 'comp-1' } } },
            ],
            project: { trashedAt: null },
          }),
        }),
      );
    });

    it('applies productId filter', async () => {
      await service.findAll({ productId: 'prod-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-1' }),
        }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies canonical lifecycle filters', async () => {
      await service.findAll({
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'CANCELLED',
      });

      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deliveryStage: 'TRANSFER',
            deliveryWorkStatus: 'ACTIVE',
            deliveryResolution: 'CANCELLED',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns extension when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Feature X',
        status: 'LOST',
      });
      const result = await service.findById('e1');
      expect(result.name).toBe('Feature X');
      expect(result.deliveryLifecycle).toMatchObject({
        resolution: 'CANCELLED',
        isTerminal: true,
      });
    });
  });

  describe('delete', () => {
    it('rejects hard delete with conflict', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1' });
      await expect(service.delete('e1')).rejects.toMatchObject({ status: 409 });
      expect(prisma.extension.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.extension.count.mockResolvedValue(3);
      const stats = await service.getStats();
      expect(stats.total).toBe(3);
    });
  });
});
