import { describe, it, expect, beforeEach } from 'vitest';
import { InvoicesService } from './invoices.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new InvoicesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies createdAt date range filter', async () => {
      await service.findAll({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
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

    it('applies type filter', async () => {
      await service.findAll({ type: 'SUBSCRIPTION' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'SUBSCRIPTION',
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

  describe('updateStatus', () => {
    it('sets paidDate when marking as PAID', async () => {
      const paidDate = new Date('2026-04-12T00:00:00.000Z');
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: '1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          status: 'WAITING',
          payments: [
            { amount: 60000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
            { amount: 40000, paymentDate: paidDate },
          ],
        })
        .mockResolvedValueOnce({
          id: '1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          status: 'WAITING',
          payments: [
            { amount: 60000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
            { amount: 40000, paymentDate: paidDate },
          ],
        });
      prisma.invoice.update.mockResolvedValue({
        id: '1',
        amount: 100000,
        payments: [
          { amount: 60000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
          { amount: 40000, paymentDate: paidDate },
        ],
        status: 'PAID',
        paidDate: new Date(),
      });
      await service.updateStatus('1', 'PAID');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            paidDate,
          }),
        }),
      );
    });

    it('rejects manual PAID status before invoice is fully covered by payments', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'manual-inv',
        orderId: null,
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        status: 'WAITING',
        payments: [{ amount: 40000, paymentDate: new Date('2026-04-10T00:00:00.000Z') }],
      });

      await expect(service.updateStatus('manual-inv', 'PAID')).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('promotes the linked deal when all order invoices are paid and amount is covered', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv-1',
        orderId: 'ord-1',
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        status: 'WAITING',
        payments: [
          { amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
          { amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
        ],
      });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        amount: 100000,
        payments: [{ amount: 100000 }],
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.invoice.findMany.mockResolvedValueOnce([
        { status: 'PAID', payments: [{ amount: 100000 }] },
        { status: 'PAID', payments: [{ amount: 50000 }] },
      ]);
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        deal: { id: 'deal-1', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'PAID', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-1', 'PAID');

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-1' },
        data: { status: 'WON' },
      });
    });

    it('does not promote the linked deal when at least one order invoice is unpaid', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv-2',
        orderId: 'ord-2',
        amount: 50000,
        dueDate: new Date('2026-04-20'),
        status: 'WAITING',
        payments: [{ amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') }],
      });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-2',
        amount: 50000,
        payments: [{ amount: 50000 }],
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.invoice.findMany.mockResolvedValueOnce([
        { status: 'PAID', payments: [{ amount: 50000 }] },
        { status: 'THIS_MONTH', payments: [] },
      ]);
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-2',
        deal: { id: 'deal-2', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'THIS_MONTH', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-2', 'PAID');

      expect(prisma.deal.update).not.toHaveBeenCalled();
    });

    it('does not promote the linked deal when paid invoices do not cover deal amount', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv-3',
        orderId: 'ord-3',
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        status: 'WAITING',
        payments: [
          { amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
          { amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
        ],
      });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-3',
        amount: 100000,
        payments: [{ amount: 100000 }],
        status: 'PAID',
        paidDate: new Date(),
      });
      prisma.invoice.findMany.mockResolvedValueOnce([
        { status: 'PAID', payments: [{ amount: 100000 }] },
        { status: 'PAID', payments: [{ amount: 100000 }] },
      ]);
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-3',
        deal: { id: 'deal-3', status: 'IN_PROGRESS', amount: 120000 },
        invoices: [
          { status: 'PAID', amount: 50000 },
          { status: 'PAID', amount: 50000 },
        ],
      });

      await service.updateStatus('inv-3', 'PAID');

      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      prisma.invoice.count.mockResolvedValue(5);
      prisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _count: 3, _sum: { amount: 40000 } })
        .mockResolvedValueOnce({ _count: 1, _sum: { amount: 10000 } });
      const stats = await service.getStats();
      expect(stats.total).toBe(5);
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats.outstanding).toEqual({ count: 3, amount: 40000 });
      expect(stats.overdue).toEqual({ count: 1, amount: 10000 });
    });

    it('applies date filters to stats queries', async () => {
      await service.getStats({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.invoice.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
      expect(prisma.invoice.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PAID',
            paidDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
