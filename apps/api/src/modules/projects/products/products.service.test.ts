import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsService } from './products.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProductsService(prisma as never);
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

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies productType filter', async () => {
      await service.findAll({ productType: 'WEBSITE' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productType: 'WEBSITE' }),
        }),
      );
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'site' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'site', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns product when found', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Test' });
      const result = await service.findById('p1');
      expect(result.name).toBe('Test');
    });
  });

  describe('create', () => {
    it('creates product with required fields', async () => {
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        name: 'Website',
        productType: 'WEBSITE',
      });
      const result = await service.create({
        projectId: 'proj-1',
        name: 'Website',
        productType: 'WEBSITE',
      });
      expect(result.productType).toBe('WEBSITE');
    });

    it('creates product with optional fields', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p1', name: 'App' });
      await service.create({
        projectId: 'proj-1',
        name: 'App',
        productType: 'MOBILE_APP',
        pmId: 'pm-1',
        deadline: '2026-12-31',
        description: 'Mobile app',
      });
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pmId: 'pm-1',
            description: 'Mobile app',
          }),
        }),
      );
    });
  });

  describe('updateStatus — stage gate', () => {
    it('allows NEW → CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'CREATING' });
      const result = await service.updateStatus('p1', 'CREATING');
      expect(result.status).toBe('CREATING');
    });

    it('allows DEVELOPMENT → QA', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'QA' });
      const result = await service.updateStatus('p1', 'QA');
      expect(result.status).toBe('QA');
    });

    it('rejects DONE → CREATING (terminal state)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DONE' });
      await expect(service.updateStatus('p1', 'CREATING')).rejects.toThrow(BadRequestException);
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'QA')).rejects.toThrow(BadRequestException);
    });

    it('allows any → LOST', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'LOST' });
      const result = await service.updateStatus('p1', 'LOST');
      expect(result.status).toBe('LOST');
    });

    it('allows ON_HOLD → back to any active stage', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'ON_HOLD' });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('p1', 'DEVELOPMENT');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('rejects invalid status string', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'INVALID')).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      await service.delete('p1');
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
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
