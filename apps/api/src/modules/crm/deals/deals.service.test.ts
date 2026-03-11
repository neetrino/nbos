import { describe, it, expect, beforeEach } from 'vitest';
import { DealsService } from './deals.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DealsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.page).toBe(1);
    });

    it('applies status and type filters', async () => {
      await service.findAll({ status: 'MEETING', type: 'NEW_PROJECT' });
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'MEETING',
            type: 'NEW_PROJECT',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns deal when found', async () => {
      prisma.deal.findUnique.mockResolvedValue({ id: '1', code: 'D-2026-0001' });
      const result = await service.findById('1');
      expect(result.code).toBe('D-2026-0001');
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code and creates deal', async () => {
      prisma.deal.findFirst.mockResolvedValue(null);
      prisma.deal.create.mockResolvedValue({ id: '1', code: 'D-2026-0001' });

      const result = await service.create({
        contactId: 'c-1',
        type: 'NEW_PROJECT',
        paymentType: 'MONTHLY',
        sellerId: 's-1',
      });

      expect(result.code).toBe('D-2026-0001');
    });
  });

  describe('updateStatus', () => {
    it('updates deal status', async () => {
      prisma.deal.findUnique.mockResolvedValue({ id: '1' });
      prisma.deal.update.mockResolvedValue({ id: '1', status: 'WON' });
      const result = await service.updateStatus('1', 'WON');
      expect(result.status).toBe('WON');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.deal.count.mockResolvedValue(10);
      const stats = await service.getStats();
      expect(stats.total).toBe(10);
    });
  });
});
