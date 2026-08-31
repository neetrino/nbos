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
    reverseJournalLineByIdempotencyKey: vi.fn().mockResolvedValue(undefined),
  };

  const paymentsService = {
    create: vi.fn().mockResolvedValue(undefined),
  };

  const moduleRef = {
    get: vi.fn().mockReturnValue(paymentsService),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    operationalJournal.appendInvoiceCardAccrualLine.mockClear();
    paymentsService.create.mockClear();
    moduleRef.get.mockClear();
    moduleRef.get.mockReturnValue(paymentsService);
    service = new InvoicesService(
      prisma as never,
      {
        handle: vi.fn().mockResolvedValue(undefined),
      } as never,
      operationalJournal as never,
      moduleRef as never,
    );
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('includes client service type for sheet source labels', async () => {
      await service.findAll({});
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            clientServiceRecord: { select: { id: true, type: true } },
          }),
        }),
      );
    });

    it('scopes list by project participation when view scope is not ALL', async () => {
      await service.findAll({
        access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'OWN' },
      });
      const listCall = prisma.invoice.findMany.mock.calls[0]?.[0] as { where?: { OR?: unknown[] } };
      expect(listCall?.where?.OR).toEqual(
        expect.arrayContaining([{ project: expect.objectContaining({ OR: expect.any(Array) }) }]),
      );
    });

    it('scopes seller list by deal participation, not full project graph', async () => {
      await service.findAll({
        access: {
          employeeId: 'emp-1',
          departmentIds: [],
          viewScope: 'OWN',
          dealScopedParticipation: true,
        },
      });
      const listCall = prisma.invoice.findMany.mock.calls[0]?.[0] as { where?: { OR?: unknown[] } };
      expect(listCall?.where?.OR).toEqual(
        expect.arrayContaining([
          { order: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
        ]),
      );
      expect(listCall?.where?.OR).not.toEqual(
        expect.arrayContaining([{ project: expect.objectContaining({ OR: expect.any(Array) }) }]),
      );
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

    it('includes client service type for sheet source labels', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoiceFindByIdRow('1'));
      await service.findById('1');
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            clientServiceRecord: { select: { id: true, type: true } },
          }),
        }),
      );
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

    it('does not start a new payment reminder cycle when leaving On Hold', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'hold-1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          moneyStatus: 'ON_HOLD',
          payments: [],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('hold-1', { moneyStatus: 'AWAITING_PAYMENT' }),
        );
      prisma.invoice.update.mockResolvedValue({});
      await service.updateMoneyStatus('hold-1', 'AWAITING_PAYMENT');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            moneyStatus: 'AWAITING_PAYMENT',
            paidDate: null,
          },
        }),
      );
    });

    it('auto-enqueues accountant send after moving to Awaiting', async () => {
      const officialWhatsApp = {
        enqueueIfAwaitingEligible: vi.fn().mockResolvedValue(undefined),
      };
      service = new InvoicesService(
        prisma as never,
        { handle: vi.fn().mockResolvedValue(undefined) } as never,
        operationalJournal as never,
        moduleRef as never,
        officialWhatsApp as never,
      );
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'await-1',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          moneyStatus: 'NEW',
          payments: [],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('await-1', { moneyStatus: 'AWAITING_PAYMENT' }),
        );
      prisma.invoice.update.mockResolvedValue({});

      await service.updateMoneyStatus('await-1', 'AWAITING_PAYMENT');

      expect(officialWhatsApp.enqueueIfAwaitingEligible).toHaveBeenCalledWith('await-1');
    });

    it('creates payment for outstanding then returns when marking PAID', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'manual-inv',
          orderId: null,
          amount: 100000,
          dueDate: new Date('2026-04-20'),
          payments: [{ amount: 40000, paymentDate: new Date('2026-04-10T00:00:00.000Z') }],
        })
        .mockResolvedValueOnce(
          mockInvoiceFindByIdRow('manual-inv', {
            payments: [
              { id: 'p1', amount: 40000, paymentDate: new Date('2026-04-10T00:00:00.000Z') },
              { id: 'p2', amount: 60000, paymentDate: new Date('2026-04-17T00:00:00.000Z') },
            ],
          }),
        );

      await service.updateMoneyStatus('manual-inv', 'PAID');

      expect(paymentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'manual-inv',
          amount: 60000,
          paymentMethod: 'TRANSACTION',
          notes: 'Auto-created when invoice marked as paid',
        }),
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('does not create payment when PAID and already fully covered', async () => {
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
      expect(paymentsService.create).not.toHaveBeenCalled();
    });

    it('promotes the linked deal when all order invoices are paid and amount is covered', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-1',
          orderId: 'ord-1',
          orderComment: 'FIRST_PHASE',
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
        data: { status: 'WON', wonMode: 'STANDARD' },
      });
    });

    it('does not promote the linked deal when at least one order invoice is unpaid', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-2',
          orderId: 'ord-2',
          orderComment: 'FIRST_PHASE',
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

    it('rejects Tax Awaiting Payment when company requisites are missing', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv-tax',
        orderId: null,
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        taxStatus: 'TAX',
        moneyStatus: 'NEW',
        companyId: null,
        officialInvoiceRequestSent: false,
        company: null,
        payments: [],
      });

      await expect(service.updateMoneyStatus('inv-tax', 'AWAITING_PAYMENT')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('rejects Tax Paid when official invoice request is not sent', async () => {
      prisma.invoice.findUnique.mockResolvedValueOnce({
        id: 'inv-tax-paid',
        orderId: null,
        amount: 100000,
        dueDate: new Date('2026-04-20'),
        taxStatus: 'TAX',
        moneyStatus: 'AWAITING_PAYMENT',
        companyId: 'c1',
        officialInvoiceRequestSent: false,
        company: { name: 'InvestOn LLC', taxId: '01234567' },
        payments: [{ amount: 100000, paymentDate: new Date('2026-04-12T00:00:00.000Z') }],
      });

      await expect(service.updateMoneyStatus('inv-tax-paid', 'PAID')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(paymentsService.create).not.toHaveBeenCalled();
    });

    it('does not promote the linked deal when paid invoices do not cover deal amount', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({
          id: 'inv-3',
          orderId: 'ord-3',
          orderComment: 'FIRST_PHASE',
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

  describe('cancel', () => {
    it('sets moneyStatus CANCELLED', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ moneyStatus: 'AWAITING_PAYMENT' })
        .mockResolvedValueOnce({
          id: 'inv-1',
          orderId: null,
          amount: 1000,
          dueDate: new Date('2026-05-01'),
          moneyStatus: 'AWAITING_PAYMENT',
          payments: [],
        })
        .mockResolvedValueOnce(mockInvoiceFindByIdRow('inv-1', { moneyStatus: 'CANCELLED' }));

      const result = await service.cancel('inv-1');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({
            moneyStatus: 'CANCELLED',
            paymentReminderCycle: { increment: 1 },
          }),
        }),
      );
      expect(result.moneyStatus).toBe('CANCELLED');
    });

    it('rejects cancel for PAID invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({ moneyStatus: 'PAID' });
      await expect(service.cancel('inv-1')).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('delete', () => {
    it('deletes NEW invoice without payments', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        moneyStatus: 'NEW',
        _count: { payments: 0 },
      });
      prisma.invoice.delete.mockResolvedValue({ id: 'inv-1' });

      await service.delete('inv-1');
      expect(prisma.invoice.delete).toHaveBeenCalledWith({ where: { id: 'inv-1' } });
    });

    it('rejects delete when payments exist', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        moneyStatus: 'NEW',
        _count: { payments: 1 },
      });
      await expect(service.delete('inv-1')).rejects.toMatchObject({ status: 409 });
    });
  });
});
