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
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({
        projectId: 'p1',
        status: 'NEW',
        productType: 'WEBSITE',
        search: 'test',
      });
      expect(prisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates product', async () => {
      prisma.product.create.mockResolvedValue({ id: '1', name: 'Web', productType: 'WEBSITE' });
      const result = await service.create({ projectId: 'p1', name: 'Web', productType: 'WEBSITE' });
      expect(result.name).toBe('Web');
    });
  });

  describe('updateStatus', () => {
    it('allows valid transition NEW -> CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1', status: 'NEW' });
      prisma.product.update.mockResolvedValue({ id: '1', status: 'CREATING' });
      const result = await service.updateStatus('1', 'CREATING');
      expect(result.status).toBe('CREATING');
    });

    it('rejects invalid transition NEW -> DONE', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1', status: 'NEW' });
      await expect(service.updateStatus('1', 'DONE')).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition from DONE', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1', status: 'DONE' });
      await expect(service.updateStatus('1', 'QA')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates fields', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1' });
      prisma.product.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const result = await service.update('1', { name: 'Updated', pmId: '', deadline: '' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.product.delete).toHaveBeenCalled();
    });
  });
});
