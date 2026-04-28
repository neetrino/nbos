import { describe, it, expect, beforeEach } from 'vitest';
import { OrdersService } from './orders.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new OrdersService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          code: 'ORD-2026-0001',
          totalAmount: 100000,
          project: {
            id: 'p1',
            code: 'P-1',
            name: 'Project',
            company: { id: 'c1', name: 'Company' },
            contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
          },
          invoices: [{ amount: 60000, payments: [{ amount: 25000 }, { amount: 15000 }] }],
          _count: { invoices: 1 },
        },
      ]);

      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
      expect(result.items[0]).toMatchObject({
        amount: 100000,
        paidAmount: 40000,
        reconciliation: {
          invoicedAmount: 60000,
          paidAmount: 40000,
          uninvoicedAmount: 40000,
          outstandingAmount: 60000,
        },
        company: { id: 'c1', name: 'Company' },
        contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
      });
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'ACTIVE' });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('applies createdAt date range filter', async () => {
      await service.findAll({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
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

    it('uses raw SQL id lookup when reconciliationGap is set', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ id: 'ord-gap' }]);
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-gap',
          code: 'ORD-1',
          totalAmount: 100000,
          project: {
            id: 'p1',
            code: 'P-1',
            name: 'Project',
            company: { id: 'c1', name: 'Company' },
            contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
          },
          deal: { id: 'd1', code: 'D-1' },
          product: null,
          extension: null,
          invoices: [{ amount: 50000, payments: [{ amount: 10000 }] }],
          _count: { invoices: 1 },
        },
      ]);

      const result = await service.findAll({ reconciliationGap: 'uninvoiced', pageSize: 10 });

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['ord-gap'] } },
        }),
      );
      expect(result.meta.total).toBe(1);
      expect(result.items[0]?.id).toBe('ord-gap');
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('returns derived paid amount and project-linked company/contact', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        code: 'ORD-2026-0001',
        totalAmount: 120000,
        project: {
          id: 'p1',
          name: 'Project',
          company: { id: 'c1', name: 'Company' },
          contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
        },
        invoices: [
          { amount: 60000, payments: [{ amount: 20000 }, { amount: 10000 }] },
          { amount: 40000, payments: [{ amount: 15000 }] },
        ],
      });

      const result = await service.findById('ord-1');

      expect(result).toMatchObject({
        amount: 120000,
        paidAmount: 45000,
        reconciliation: {
          invoicedAmount: 100000,
          paidAmount: 45000,
          uninvoicedAmount: 20000,
          outstandingAmount: 75000,
        },
        company: { id: 'c1', name: 'Company' },
        contact: { id: 'ct1', firstName: 'Jane', lastName: 'Doe' },
      });
    });
  });

  describe('create', () => {
    it('generates code ORD-YYYY-NNNN', async () => {
      prisma.order.create.mockResolvedValue({ id: '1', code: 'ORD-2026-0001' });
      const result = await service.create({
        projectId: 'p1',
        type: 'PRODUCT',
        paymentType: 'FULL',
        totalAmount: 100000,
      });
      expect(result.code).toMatch(/^ORD-\d{4}-\d{4}$/);
    });
  });

  describe('updateStatus', () => {
    it('updates status when found', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: '1',
        project: { company: null, contact: null },
        invoices: [],
      });
      prisma.order.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });
      const result = await service.updateStatus('1', 'COMPLETED');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('getStats', () => {
    it('returns aggregate order totals', async () => {
      prisma.order.count.mockResolvedValue(4);
      prisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 250000 } });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 150000 } });

      const stats = await service.getStats();

      expect(stats).toMatchObject({
        totalOrders: 4,
        totalAmount: 250000,
        collectedAmount: 150000,
        outstandingAmount: 100000,
      });
      expect(prisma.order.groupBy).toHaveBeenCalled();
    });
  });
});
