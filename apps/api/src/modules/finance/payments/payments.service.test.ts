import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentsService } from './payments.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/** Row returned by `findById` after `create` completes sync helpers. */
function mockPaymentFindByIdRow(
  id: string,
  overrides: Record<string, unknown> & {
    amount?: number;
    invoice?: Record<string, unknown>;
  } = {},
) {
  const { amount = 50000, invoice: invoiceOverrides, ...rest } = overrides;
  return {
    id,
    invoiceId: 'inv1',
    amount,
    paymentDate: new Date('2026-03-11'),
    paymentMethod: null,
    confirmedBy: null,
    notes: null,
    invoice: {
      id: 'inv1',
      code: 'INV-TEST',
      projectId: 'proj-1',
      amount: 100000,
      status: 'WAITING',
      company: { id: 'comp-1', name: 'ACME' },
      order: {
        id: 'ord1',
        code: 'ORD-1',
        project: { id: 'proj-1', name: 'Main Project' },
      },
      subscription: null,
      ...(invoiceOverrides ?? {}),
    },
    confirmer: null,
    ...rest,
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PaymentsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          amount: 50000,
          invoice: {
            id: 'inv-1',
            code: 'INV-1',
            type: 'DEVELOPMENT',
            projectId: 'proj-1',
            company: { id: 'comp-1', name: 'ACME' },
            order: { project: { id: 'proj-1', name: 'Main Project' } },
            subscription: null,
          },
          confirmer: { id: 'emp-1', firstName: 'John', lastName: 'Smith' },
        },
      ]);

      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
      expect(result.items[0]).toMatchObject({
        company: { id: 'comp-1', name: 'ACME' },
        project: { id: 'proj-1', name: 'Main Project' },
        confirmer: { id: 'emp-1', firstName: 'John', lastName: 'Smith' },
      });
    });

    it('applies invoiceId filter', async () => {
      await service.findAll({ invoiceId: 'inv1' });
      expect(prisma.payment.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('returns derived project and company from invoice relations', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        invoiceId: 'inv-1',
        invoice: {
          id: 'inv-1',
          code: 'INV-1',
          projectId: 'proj-1',
          company: { id: 'comp-1', name: 'ACME' },
          order: { id: 'ord-1', code: 'ORD-1', project: { id: 'proj-1', name: 'Main Project' } },
          subscription: null,
        },
        confirmer: { id: 'emp-1', firstName: 'John', lastName: 'Smith' },
      });

      const result = await service.findById('pay-1');

      expect(result).toMatchObject({
        company: { id: 'comp-1', name: 'ACME' },
        project: { id: 'proj-1', name: 'Main Project' },
      });
    });
  });

  describe('create', () => {
    it('creates payment and keeps invoice waiting while amount is only partially covered', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv1',
          orderId: 'ord1',
          amount: 100000,
          status: 'WAITING',
          dueDate: new Date('2026-05-20'),
          payments: [],
        })
        .mockResolvedValueOnce({
          amount: 100000,
          dueDate: new Date('2026-05-20'),
          status: 'WAITING',
          payments: [{ amount: 50000 }],
        });
      prisma.payment.create.mockResolvedValue({ id: '1', amount: 50000 });
      prisma.invoice.findMany.mockResolvedValue([
        { status: 'WAITING', amount: 100000, payments: [{ amount: 50000 }] },
      ]);
      prisma.payment.findUnique.mockResolvedValue(mockPaymentFindByIdRow('1'));

      const result = await service.create({
        invoiceId: 'inv1',
        amount: 50000,
        paymentDate: '2026-03-11',
      });
      expect(result.amount).toBe(50000);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { status: 'WAITING', paidDate: null },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord1' },
        data: { status: 'PARTIALLY_PAID' },
      });
    });

    it('marks invoice and order as paid when coverage reaches total amount', async () => {
      const latestPaymentDate = new Date('2026-03-12T00:00:00.000Z');
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv1',
          orderId: 'ord1',
          amount: 100000,
          status: 'WAITING',
          dueDate: new Date('2026-03-20'),
          payments: [{ amount: 60000 }],
        })
        .mockResolvedValueOnce({
          amount: 100000,
          dueDate: new Date('2026-03-20'),
          status: 'WAITING',
          payments: [
            { amount: 60000, paymentDate: new Date('2026-03-10T00:00:00.000Z') },
            { amount: 40000, paymentDate: latestPaymentDate },
          ],
        });
      prisma.payment.create.mockResolvedValue({ id: '2', amount: 40000 });
      prisma.invoice.findMany.mockResolvedValue([
        { status: 'PAID', amount: 100000, payments: [{ amount: 100000 }] },
        { status: 'PAID', amount: 50000, payments: [{ amount: 50000 }] },
      ]);
      prisma.payment.findUnique.mockResolvedValue(
        mockPaymentFindByIdRow('2', {
          amount: 40000,
          invoice: {
            status: 'PAID',
          },
        }),
      );

      await service.create({
        invoiceId: 'inv1',
        amount: 40000,
        paymentDate: '2026-03-12',
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { status: 'PAID', paidDate: latestPaymentDate },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord1' },
        data: { status: 'FULLY_PAID' },
      });
    });

    it('marks unpaid overdue invoice as delayed after payment sync if still not fully covered', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv1',
          orderId: 'ord1',
          amount: 100000,
          status: 'THIS_MONTH',
          dueDate: new Date('2026-03-01'),
          payments: [],
        })
        .mockResolvedValueOnce({
          amount: 100000,
          dueDate: new Date('2026-03-01'),
          status: 'THIS_MONTH',
          payments: [{ amount: 30000 }],
        });
      prisma.payment.create.mockResolvedValue({ id: '3', amount: 30000 });
      prisma.invoice.findMany.mockResolvedValue([
        { status: 'DELAYED', amount: 100000, payments: [{ amount: 30000 }] },
      ]);
      prisma.payment.findUnique.mockResolvedValue(
        mockPaymentFindByIdRow('3', { amount: 30000, invoice: { status: 'DELAYED' } }),
      );

      await service.create({
        invoiceId: 'inv1',
        amount: 30000,
        paymentDate: '2026-03-12',
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { status: 'DELAYED', paidDate: null },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord1' },
        data: { status: 'PARTIALLY_PAID' },
      });
    });

    it('rejects payment that exceeds remaining invoice balance', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv1',
        orderId: 'ord1',
        amount: 100000,
        status: 'WAITING',
        dueDate: new Date('2026-03-20'),
        payments: [{ amount: 90000 }],
      });

      await expect(
        service.create({
          invoiceId: 'inv1',
          amount: 20000,
          paymentDate: '2026-03-12',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: '1',
        invoiceId: 'inv1',
        invoice: { orderId: 'ord1' },
      });
      prisma.invoice.findUnique.mockResolvedValue({
        amount: 100000,
        payments: [],
      });
      prisma.invoice.findMany.mockResolvedValue([
        { status: 'THIS_MONTH', amount: 100000, payments: [] },
      ]);
      await service.delete('1');
      expect(prisma.payment.delete).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns aggregate payment totals', async () => {
      prisma.payment.count.mockResolvedValue(7);
      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 210000 } })
        .mockResolvedValueOnce({ _sum: { amount: 50000 } });

      const stats = await service.getStats();

      expect(stats).toEqual({
        totalPayments: 7,
        totalCollected: 210000,
        thisMonthCollected: 50000,
      });
    });

    it('applies period filters to total and month-scoped aggregates', async () => {
      prisma.payment.count.mockResolvedValue(2);
      prisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 15000 } })
        .mockResolvedValueOnce({ _sum: { amount: 4000 } });

      await service.getStats({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.payment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );

      expect(prisma.payment.aggregate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });
});
