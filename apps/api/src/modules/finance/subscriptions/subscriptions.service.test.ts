import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionsService } from './subscriptions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new SubscriptionsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({ projectId: 'p1', status: 'ACTIVE', type: 'MAINTENANCE_ONLY' });
      expect(prisma.subscription.findMany).toHaveBeenCalled();
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'acme' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { code: { contains: 'acme', mode: 'insensitive' } },
              { project: { name: { contains: 'acme', mode: 'insensitive' } } },
            ],
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code SUB-YYYY-NNNN', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({ id: '1', code: 'SUB-2026-0001' });
      const result = await service.create({
        projectId: 'p1',
        type: 'MAINTENANCE_ONLY',
        amount: 50000,
        billingDay: 1,
        startDate: '2026-01-01',
      });
      expect(result.code).toMatch(/^SUB-\d{4}-\d{4}$/);
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ id: '1' });
      prisma.subscription.update.mockResolvedValue({ id: '1', status: 'CANCELLED' });
      const result = await service.updateStatus('1', 'CANCELLED');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
    });
  });
});
