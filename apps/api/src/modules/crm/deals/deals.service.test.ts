import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: MockPrisma;
  let wonHandler: { handle: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    wonHandler = { handle: vi.fn().mockResolvedValue(undefined) };
    service = new DealsService(prisma as never, wonHandler as unknown as DealWonHandler);
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
    it('returns current deal when status is unchanged', async () => {
      const currentDeal = {
        id: '1',
        status: 'WON',
        type: 'PRODUCT',
        amount: 5000,
        paymentType: 'CLASSIC',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        pmId: 'pm-1',
        deadline: new Date(),
        existingProductId: null,
      };

      prisma.deal.findUnique.mockResolvedValue(currentDeal);

      const result = await service.updateStatus('1', 'WON');

      expect(result).toEqual(currentDeal);
      expect(prisma.deal.update).not.toHaveBeenCalled();
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });

    it('updates deal status for early stage (no gate)', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        type: 'PRODUCT',
        amount: null,
        paymentType: null,
        productCategory: null,
        productType: null,
        pmId: null,
        deadline: null,
        existingProductId: null,
      });
      prisma.deal.update.mockResolvedValue({ id: '1', status: 'MEETING' });
      const result = await service.updateStatus('1', 'MEETING');
      expect(result.status).toBe('MEETING');
    });

    it('blocks WON when required fields missing', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        type: 'PRODUCT',
        amount: null,
        paymentType: null,
        productCategory: null,
        productType: null,
        pmId: null,
        deadline: null,
        existingProductId: null,
      });
      await expect(service.updateStatus('1', 'WON')).rejects.toThrow('missing required fields');
    });

    it('allows WON when all required fields present', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        type: 'PRODUCT',
        amount: 5000,
        paymentType: 'CLASSIC',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        pmId: 'pm-1',
        deadline: new Date(),
        existingProductId: null,
      });
      prisma.deal.update.mockResolvedValue({
        id: '1',
        status: 'WON',
        type: 'PRODUCT',
      });
      const result = await service.updateStatus('1', 'WON');
      expect(result.status).toBe('WON');
      expect(wonHandler.handle).toHaveBeenCalledTimes(1);
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
