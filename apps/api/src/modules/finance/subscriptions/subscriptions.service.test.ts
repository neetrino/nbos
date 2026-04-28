import { describe, it, expect, beforeEach } from 'vitest';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import { SubscriptionsService } from './subscriptions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function mockSubscriptionForFindById(
  overrides: Partial<{ status: string; startDate: Date; endDate: Date | null }> = {},
) {
  return {
    id: '1',
    code: 'SUB-2026-0001',
    amount: 5000,
    status: 'ACTIVE',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: null as Date | null,
    invoices: [],
    project: { id: 'p', code: 'P', name: 'Proj' },
    partner: null,
    ...overrides,
  };
}

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

    it('attaches coverage metadata', async () => {
      prisma.subscription.findMany.mockResolvedValue([
        {
          id: '1',
          amount: 1000,
          status: 'ACTIVE',
          startDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: null,
        },
      ]);

      const result = await service.findAll({});
      expect(result.items[0]).toMatchObject({
        coverage: {
          firstCoveredMonth: 2,
          activeMonthCount: 10,
          annualizedAmount: 10000,
        },
      });
    });

    it('applies filters', async () => {
      await service.findAll({ projectId: 'p1', status: 'PENDING', type: 'MAINTENANCE_ONLY' });
      expect(prisma.subscription.findMany).toHaveBeenCalled();
    });

    it('filters by partner id', async () => {
      await service.findAll({ partnerId: 'part-1' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ partnerId: 'part-1' }),
        }),
      );
    });

    it('filters unlinked subscriptions via sentinel value', async () => {
      await service.findAll({ partnerId: SUBSCRIPTION_PARTNER_FILTER_UNLINKED });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ partnerId: null }),
        }),
      );
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

    it('applies createdAt date range filter', async () => {
      await service.findAll({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
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
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ status: 'ACTIVE' }),
      );
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscriptionForFindById({ status: 'ON_HOLD' }),
      });
      const result = await service.updateStatus('1', 'ON_HOLD');
      expect(result.status).toBe('ON_HOLD');
    });

    it('activates pending subscription without replacing existing start date', async () => {
      const startDate = new Date('2026-01-15T00:00:00.000Z');
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ status: 'PENDING', startDate }),
      );
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscriptionForFindById({ status: 'ACTIVE', startDate }),
      });

      const result = await service.updateStatus('1', 'ACTIVE');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACTIVE' },
        }),
      );
      expect(result.coverage).toMatchObject({ firstCoveredMonth: 0, activeMonthCount: 12 });
    });

    it('rejects invalid subscription status', async () => {
      await expect(service.updateStatus('1', 'PAUSED')).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects disallowed transition from CANCELLED', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ status: 'CANCELLED', endDate: new Date() }),
      );

      await expect(service.updateStatus('1', 'ACTIVE')).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects no-op status update', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ status: 'ACTIVE' }),
      );

      await expect(service.updateStatus('1', 'ACTIVE')).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.subscription.count.mockResolvedValueOnce(8).mockResolvedValueOnce(5);
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
      expect(stats.activeSubscriptions).toBe(5);
    });

    it('applies date filters to grouped stats queries', async () => {
      await service.getStats({
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-03-31T23:59:59.999Z',
      });

      expect(prisma.subscription.count).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
      expect(prisma.subscription.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
