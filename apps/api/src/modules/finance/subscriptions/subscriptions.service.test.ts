import { describe, it, expect, beforeEach } from 'vitest';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import { SubscriptionsService } from './subscriptions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function mockSubscriptionForFindById(
  overrides: Partial<{
    status: string;
    billingStartDate: Date;
    endDate: Date | null;
    termMonths: number | null;
    coverageMonthCount: number;
    billingFrequency: string;
    name: string;
  }> = {},
) {
  return {
    id: '1',
    code: 'SUB-2026-0001',
    name: 'Website Care',
    amount: 5000,
    coverageMonthCount: 1,
    monthlyEquivalentAmount: 5000,
    billingFrequency: 'MONTHLY',
    notificationsEnabled: true,
    status: 'ACTIVE',
    billingStartDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: null as Date | null,
    termMonths: null as number | null,
    invoices: [],
    project: { id: 'p', code: 'P', name: 'Proj' },
    product: { id: 'prod-1', name: 'Website', projectId: 'p' },
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

    it('attaches coverage metadata from paid subscription invoices', async () => {
      prisma.subscription.findMany.mockResolvedValue([
        {
          id: '1',
          amount: 1000,
          coverageMonthCount: 1,
          monthlyEquivalentAmount: 1000,
          status: 'ACTIVE',
          billingStartDate: new Date('2026-03-01T00:00:00.000Z'),
          endDate: null,
          project: { id: 'p', code: 'P', name: 'Proj' },
          partner: null,
          _count: { invoices: 1 },
          invoices: [
            {
              type: 'SUBSCRIPTION',
              amount: 1000,
              coverageStartMonth: '2026-03',
              coverageMonthCount: 2,
              payments: [{ amount: 1000 }],
            },
          ],
        },
      ]);

      const result = await service.findAll({});
      expect(result.items[0]).toMatchObject({
        coverage: {
          firstCoveredMonth: 2,
          activeMonthCount: 2,
          annualizedAmount: 2000,
        },
      });
    });

    it('applies filters', async () => {
      await service.findAll({ projectId: 'p1', status: 'PENDING', type: 'MAINTENANCE_ONLY' });
      expect(prisma.subscription.findMany).toHaveBeenCalled();
    });

    it('filters a single status with equals and inbox order', async () => {
      await service.findAll({ status: 'CANCELLED' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CANCELLED' }),
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('filters a comma-separated status list with in and inbox order', async () => {
      await service.findAll({ status: 'PENDING,ACTIVE' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { in: ['PENDING', 'ACTIVE'] } }),
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('omits status and still uses inbox order when status is absent', async () => {
      await service.findAll({});
      const call = prisma.subscription.findMany.mock.calls[0]?.[0] as {
        where?: { status?: unknown };
        orderBy?: unknown;
      };
      expect(call?.where).not.toHaveProperty('status');
      expect(call?.orderBy).toEqual([{ status: 'asc' }, { createdAt: 'desc' }]);
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
      const call = prisma.subscription.findMany.mock.calls[0]?.[0] as {
        where?: { OR?: { code?: { contains: string } }[] };
      };
      const orClause = call?.where?.OR ?? [];
      expect(orClause.some((c) => c.code?.contains === 'acme')).toBe(true);
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

  describe('getGrid', () => {
    it('filters a single status with equals and inbox order', async () => {
      await service.getGrid({ year: 2026, status: 'CANCELLED' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ status: 'CANCELLED' }]),
          }),
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('filters a comma-separated status list with in and inbox order', async () => {
      await service.getGrid({ year: 2026, status: 'PENDING,ACTIVE' });
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ status: { in: ['PENDING', 'ACTIVE'] } }]),
          }),
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });

    it('applies billingStartDate lte yearEnd in the year window', async () => {
      await service.getGrid({ year: 2026 });
      const call = prisma.subscription.findMany.mock.calls[0]?.[0] as {
        where?: { AND?: unknown[] };
        orderBy?: unknown;
      };
      const andClause = call?.where?.AND ?? [];
      expect(JSON.stringify(andClause)).not.toContain('"billingStartDate":null');
      expect(andClause).toEqual(
        expect.arrayContaining([
          { billingStartDate: { lte: new Date(2026, 11, 31, 23, 59, 59, 999) } },
          expect.objectContaining({
            OR: [{ endDate: null }, { endDate: { gte: new Date(2026, 0, 1) } }],
          }),
        ]),
      );
      expect(call?.orderBy).toEqual([{ status: 'asc' }, { createdAt: 'desc' }]);
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
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'p1' });
      prisma.subscription.create.mockResolvedValue({ id: '1', code: 'SUB-2026-0001' });
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());
      const result = await service.create({
        productId: 'prod-1',
        projectId: 'p1',
        name: 'Website Care Plan',
        type: 'MAINTENANCE_ONLY',
        amount: 50000,
        billingDay: 1,
        billingFrequency: 'MONTHLY',
        startDate: '2026-01-01',
      });
      expect(result.code).toMatch(/^SUB-\d{4}-\d{4}$/);
      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-1',
            projectId: 'p1',
            name: 'Website Care Plan',
            amount: 50000,
            billingFrequency: 'MONTHLY',
            coverageMonthCount: 1,
          }),
        }),
      );
      const createData = prisma.subscription.create.mock.calls[0]?.[0] as {
        data?: Record<string, unknown>;
      };
      expect(createData?.data).not.toHaveProperty('monthlyEquivalentAmount');
    });

    it('rejects create when name is missing or blank', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'p1' });

      await expect(
        service.create({
          productId: 'prod-1',
          projectId: 'p1',
          type: 'MAINTENANCE_ONLY',
          amount: 50000,
          billingDay: 1,
          billingFrequency: 'MONTHLY',
          startDate: '2026-01-01',
        } as never),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          productId: 'prod-1',
          projectId: 'p1',
          name: '   ',
          type: 'MAINTENANCE_ONLY',
          amount: 50000,
          billingDay: 1,
          billingFrequency: 'MONTHLY',
          startDate: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it('trims and persists commercial name on create', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'p1' });
      prisma.subscription.create.mockResolvedValue({ id: '1', code: 'SUB-2026-0001' });
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ name: 'Trimmed Care' }),
      );

      await service.create({
        productId: 'prod-1',
        projectId: 'p1',
        name: '  Trimmed Care  ',
        type: 'MAINTENANCE_ONLY',
        amount: 50000,
        billingDay: 1,
        billingFrequency: 'MONTHLY',
        startDate: '2026-01-01',
      });

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Trimmed Care' }),
        }),
      );
    });

    it('rejects create when billingFrequency is omitted', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'p1' });

      await expect(
        service.create({
          productId: 'prod-1',
          projectId: 'p1',
          name: 'Care',
          type: 'MAINTENANCE_ONLY',
          amount: 50000,
          billingDay: 1,
          startDate: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates commercial name when provided', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());
      prisma.subscription.update.mockResolvedValue({});

      await service.update('1', { name: '  Renamed Care  ' });

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Renamed Care' }),
        }),
      );
    });

    it('rejects blank name on update', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());

      await expect(service.update('1', { name: '   ' })).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('clears endDate when blank string is sent', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ endDate: new Date('2026-06-01T00:00:00.000Z') }),
      );
      prisma.subscription.update.mockResolvedValue({});

      await service.update('1', { endDate: '' });

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ endDate: null }),
        }),
      );
    });

    it('leaves endDate untouched when undefined', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());
      prisma.subscription.update.mockResolvedValue({});

      await service.update('1', { billingDay: 15 });

      const call = prisma.subscription.update.mock.calls[0]?.[0] as {
        data?: { endDate?: unknown; billingFrequency?: unknown };
      };
      expect(call?.data?.endDate).toBeUndefined();
      expect(call?.data?.billingFrequency).toBeUndefined();
      expect(call?.data).not.toHaveProperty('monthlyEquivalentAmount');
    });

    it('rejects invalid endDate string', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());

      await expect(service.update('1', { endDate: 'not-a-date' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects termMonths below minimum', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());

      await expect(service.update('1', { termMonths: 0 })).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects termMonths above maximum', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());

      await expect(service.update('1', { termMonths: 121 })).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('accepts null termMonths to clear the term', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());
      prisma.subscription.update.mockResolvedValue({});

      await service.update('1', { termMonths: null });

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ termMonths: null }),
        }),
      );
    });

    it('accepts valid termMonths', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscriptionForFindById());
      prisma.subscription.update.mockResolvedValue({});

      await service.update('1', { termMonths: 6 });

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ termMonths: 6 }),
        }),
      );
    });

    it('rejects termMonths that do not divide by coverageMonthCount', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({
          billingFrequency: 'CUSTOM',
          coverageMonthCount: 4,
        }),
      );

      await expect(service.update('1', { termMonths: 6 })).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.subscription.findUnique
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'ACTIVE' }))
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'ON_HOLD' }));
      prisma.subscription.update.mockResolvedValue({});
      const result = await service.updateStatus('1', 'ON_HOLD');
      expect(result.status).toBe('ON_HOLD');
    });

    it('activates pending subscription without replacing existing billing start date', async () => {
      const billingStartDate = new Date('2026-01-15T00:00:00.000Z');
      prisma.subscription.findUnique
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'PENDING', billingStartDate }))
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'ACTIVE', billingStartDate }));
      prisma.subscription.update.mockResolvedValue({});

      const result = await service.updateStatus('1', 'ACTIVE');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACTIVE' },
        }),
      );
      expect(result.coverage).toMatchObject({
        firstCoveredMonth: null,
        activeMonthCount: 0,
        annualizedAmount: 0,
      });
    });

    it('sets endDate when completing a subscription without one', async () => {
      prisma.subscription.findUnique
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'ACTIVE', endDate: null }))
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'COMPLETED' }));
      prisma.subscription.update.mockResolvedValue({});

      await service.updateStatus('1', 'COMPLETED');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            endDate: expect.any(Date),
          }),
        }),
      );
    });

    it('preserves existing endDate when completing', async () => {
      const endDate = new Date('2026-05-01T00:00:00.000Z');
      prisma.subscription.findUnique
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'ON_HOLD', endDate }))
        .mockResolvedValueOnce(mockSubscriptionForFindById({ status: 'COMPLETED', endDate }));
      prisma.subscription.update.mockResolvedValue({});

      await service.updateStatus('1', 'COMPLETED');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED' },
        }),
      );
    });

    it('rejects invalid subscription status', async () => {
      await expect(service.updateStatus('1', 'PAUSED')).rejects.toThrow(BadRequestException);
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('resumes cancelled subscription and clears endDate', async () => {
      const billingStartDate = new Date('2026-01-15T00:00:00.000Z');
      const endDate = new Date('2026-06-01T00:00:00.000Z');
      prisma.subscription.findUnique
        .mockResolvedValueOnce(
          mockSubscriptionForFindById({ status: 'CANCELLED', billingStartDate, endDate }),
        )
        .mockResolvedValueOnce(
          mockSubscriptionForFindById({ status: 'ACTIVE', billingStartDate, endDate: null }),
        );
      prisma.subscription.update.mockResolvedValue({});

      await service.updateStatus('1', 'ACTIVE');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACTIVE', endDate: null },
        }),
      );
    });

    it('rejects COMPLETED → ACTIVE', async () => {
      prisma.subscription.findUnique.mockResolvedValue(
        mockSubscriptionForFindById({ status: 'COMPLETED' }),
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

    it('applies partnerId to aggregate queries', async () => {
      prisma.subscription.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
      await service.getStats({ partnerId: 'partner-uuid-1' });

      expect(prisma.subscription.count).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({ partnerId: 'partner-uuid-1' }),
        }),
      );
      expect(prisma.subscription.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnerId: 'partner-uuid-1',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('maps unlinked partner filter for stats', async () => {
      prisma.subscription.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
      await service.getStats({ partnerId: SUBSCRIPTION_PARTNER_FILTER_UNLINKED });

      expect(prisma.subscription.count).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({ partnerId: null }),
        }),
      );
    });
  });
});
