import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoicesService } from './invoices.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/** Full row shape for `findById` (returned after create/updateStatus). */
function mockInvoiceFindByIdRow(
  id: string,
  overrides: Record<string, unknown> & {
    amount?: number;
    payments?: Array<{ id?: string; amount: number; paymentDate: Date }>;
  } = {},
) {
  const {
    amount = 100000,
    payments = [
      { id: 'p1', amount: 60000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
      { id: 'p2', amount: 40000, paymentDate: new Date('2026-04-12T00:00:00.000Z') },
    ],
    ...rest
  } = overrides;
  return {
    id,
    code: `INV-2026-${id}`,
    amount,
    dueDate: new Date('2026-04-20'),
    moneyStatus: 'PAID',
    type: 'SUBSCRIPTION',
    taxStatus: 'TAX',
    orderId: null,
    subscriptionId: null,
    projectId: 'proj-1',
    companyId: null,
    createdAt: new Date(),
    order: null,
    subscription: null,
    company: null,
    payments,
    paidDate: new Date('2026-04-12T00:00:00.000Z'),
    ...rest,
  };
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: MockPrisma;

  const operationalJournal = {
    appendInvoiceCardAccrualLine: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    operationalJournal.appendInvoiceCardAccrualLine.mockClear();
    service = new InvoicesService(
      prisma as never,
      {
        handle: vi.fn().mockResolvedValue(undefined),
      } as never,
      operationalJournal as never,
    );
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

    it('applies subscriptionId filter', async () => {
      await service.findAll({ subscriptionId: 'sub-1' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionId: 'sub-1',
          }),
        }),
      );
    });

    it('applies moneyStatus filter', async () => {
      await service.findAll({ moneyStatus: 'OVERDUE' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moneyStatus: 'OVERDUE',
          }),
        }),
      );
    });

    it('rejects unknown moneyStatus filter', async () => {
      await expect(service.findAll({ moneyStatus: 'nope' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMoneyStatus', () => {
    it('sets paidDate when marking money PAID and fully covered', async () => {
      const paidDate = new Date('2026-04-12T00:00:00.000Z');
      const fullPayments = [
        { id: 'p1', amount: 60000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
        { id: 'p2', amount: 40000, paymentDate: paidDate },
      ];
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: '1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          payments: fullPayments.map((p) => ({ amount: p.amount, paymentDate: p.paymentDate })),
        })
        .mockResolvedValueOnce(mockInvoiceFindByIdRow('1', { paidDate, payments: fullPayments }));
      prisma.invoice.update.mockResolvedValue({});
      await service.updateMoneyStatus('1', 'PAID');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moneyStatus: 'PAID',
            paidDate,
          }),
        }),
      );
    });

    it('sets OVERDUE money when valid for partial coverage', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'ov-1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          payments: [{ amount: 10000, paymentDate: new Date('2026-04-10T00:00:00.000Z') }],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('ov-1', {
            moneyStatus: 'OVERDUE',
            payments: [
              { id: 'p1', amount: 10000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
            ],
            paidDate: null,
          }),
        );
      prisma.invoice.update.mockResolvedValue({});
      await service.updateMoneyStatus('ov-1', 'OVERDUE');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moneyStatus: 'OVERDUE',
            paidDate: null,
          }),
        }),
      );
    });

    it('rejects PAID money before invoice is fully covered by payments', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'manual-inv',
        orderId: null,
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        payments: [{ amount: 40000, paymentDate: new Date('2026-04-10T00:00:00.000Z') }],
      });

      await expect(service.updateMoneyStatus('manual-inv', 'PAID')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('promotes the linked deal when all order invoices are paid and amount is covered', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-1',
          orderId: 'ord-1',
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          payments: [
            { amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
            { amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
          ],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('inv-1', {
            orderId: 'ord-1',
            payments: [
              { id: 'p1', amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
              { id: 'p2', amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
            ],
          }),
        );
      prisma.invoice.update.mockResolvedValue({});
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        deal: { id: 'deal-1', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { moneyStatus: 'PAID', amount: 50000 },
          { moneyStatus: 'PAID', amount: 50000 },
        ],
      });
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        code: 'D-2026-0001',
        type: 'PRODUCT',
        contactId: 'contact-1',
        orders: [],
      });

      await service.updateMoneyStatus('inv-1', 'PAID');

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-1' },
        data: { status: 'WON' },
      });
    });

    it('does not promote the linked deal when at least one order invoice is unpaid', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-2',
          orderId: 'ord-2',
          amount: 50000,
          dueDate: new Date('2026-04-20'),
          payments: [{ amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') }],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('inv-2', {
            orderId: 'ord-2',
            amount: 50000,
            payments: [
              { id: 'p1', amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
            ],
          }),
        );
      prisma.invoice.update.mockResolvedValue({});
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-2',
        deal: { id: 'deal-2', status: 'IN_PROGRESS', amount: 100000 },
        invoices: [
          { moneyStatus: 'PAID', amount: 50000 },
          { moneyStatus: 'NEW', amount: 50000 },
        ],
      });

      await service.updateMoneyStatus('inv-2', 'PAID');

      expect(prisma.deal.update).not.toHaveBeenCalled();
    });

    it('does not promote the linked deal when paid invoices do not cover deal amount', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-3',
          orderId: 'ord-3',
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          payments: [
            { amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
            { amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
          ],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('inv-3', {
            orderId: 'ord-3',
            payments: [
              { id: 'p1', amount: 50000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
              { id: 'p2', amount: 50000, paymentDate: new Date('2026-04-11T00:00:00.000Z') },
            ],
          }),
        );
      prisma.invoice.update.mockResolvedValue({});
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord-3',
        deal: { id: 'deal-3', status: 'IN_PROGRESS', amount: 120000 },
        invoices: [
          { moneyStatus: 'PAID', amount: 50000 },
          { moneyStatus: 'PAID', amount: 50000 },
        ],
      });

      await service.updateMoneyStatus('inv-3', 'PAID');

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
            moneyStatus: 'PAID',
            paidDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('applies subscriptionId to stats queries', async () => {
      prisma.invoice.count.mockResolvedValue(2);
      prisma.invoice.groupBy.mockResolvedValue([]);
      prisma.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } })
        .mockResolvedValueOnce({ _count: 1, _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      await service.getStats({ subscriptionId: 'sub-abc' });

      expect(prisma.invoice.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subscriptionId: 'sub-abc' }),
        }),
      );
      expect(prisma.invoice.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subscriptionId: 'sub-abc' }),
        }),
      );
      expect(prisma.invoice.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            moneyStatus: 'PAID',
            subscriptionId: 'sub-abc',
          }),
        }),
      );
    });
  });
});
