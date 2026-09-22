import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
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

  describe('create', () => {
    it('requires a linked product', async () => {
      await expect(
        service.create({
          projectId: 'proj-1',
          productId: '',
          name: 'Add login',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.extension.create).not.toHaveBeenCalled();
    });

    it('creates extension with required product link', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-1' });
      prisma.extension.create.mockResolvedValue({
        id: 'e1',
        name: 'Add login',
      });
      const result = await service.create({
        projectId: 'proj-1',
        productId: 'prod-1',
        name: 'Add login',
      });
      expect(result.name).toBe('Add login');
    });

    it('creates extension with product link', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-1' });
      prisma.extension.create.mockResolvedValue({ id: 'e1', name: 'Feature' });
      await service.create({
        projectId: 'proj-1',
        productId: 'prod-1',
        name: 'Feature',
        assignedTo: 'dev-1',
      });
      expect(prisma.extension.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-1',
            assignedTo: 'dev-1',
          }),
        }),
      );
      expect(prisma.extension.create.mock.calls[0]?.[0].data).not.toHaveProperty('size');
    });

    it('rejects product from another project', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-2', projectId: 'other-project' });

      await expect(
        service.create({
          projectId: 'proj-1',
          productId: 'prod-2',
          name: 'Feature',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.extension.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects attempts to remove linked product', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-1',
      });

      const payload = { productId: null } as unknown as Parameters<typeof service.update>[1];

      await expect(service.update('e1', payload)).rejects.toThrow(BadRequestException);
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('allows relinking to product from the same project', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-1',
      });
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-2', projectId: 'proj-1' });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-2',
      });

      await service.update('e1', { productId: 'prod-2' });

      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ productId: 'prod-2' }),
        }),
      );
    });
  });
});
