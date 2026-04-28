import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceSummaryService } from './summary.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

describe('FinanceSummaryService', () => {
  let service: FinanceSummaryService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new FinanceSummaryService(prisma as never);
  });

  it('returns finance dashboard summary from aggregate sources', async () => {
    prisma.invoice.count.mockResolvedValue(6);
    prisma.invoice.groupBy.mockResolvedValue([
      { status: 'PAID', _count: 3, _sum: { amount: 120000 } },
      { status: 'DELAYED', _count: 1, _sum: { amount: 15000 } },
      { status: 'WAITING', _count: 2, _sum: { amount: 30000 } },
    ]);
    prisma.invoice.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 120000 } })
      .mockResolvedValueOnce({ _count: 3, _sum: { amount: 45000 } })
      .mockResolvedValueOnce({ _count: 1, _sum: { amount: 15000 } });
    prisma.subscription.aggregate.mockResolvedValue({ _sum: { amount: 25000 } });
    prisma.subscription.count.mockResolvedValue(4);
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: 50000,
        paymentDate: new Date('2026-04-20'),
        invoice: {
          id: 'inv-1',
          code: 'INV-1',
          company: { id: 'comp-1', name: 'ACME' },
          order: { project: { id: 'proj-1', name: 'Main Project' } },
          subscription: null,
          projectId: 'proj-1',
        },
      },
    ]);
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'inv-2',
        code: 'INV-2',
        amount: 15000,
        dueDate: new Date('2026-04-25'),
        company: { id: 'comp-2', name: 'Globex' },
        projectId: 'proj-2',
      },
    ]);
    prisma.order.findMany.mockResolvedValue([
      {
        totalAmount: 100000,
        invoices: [
          {
            amount: 90000,
            payments: [{ amount: 70000 }],
          },
        ],
      },
    ]);

    const result = await service.getDashboardSummary();

    expect(result.kpis).toEqual({
      totalRevenue: 120000,
      outstandingAmount: 45000,
      outstandingCount: 3,
      overdueAmount: 15000,
      overdueCount: 1,
      monthlyRecurringRevenue: 25000,
      activeSubscriptions: 4,
    });
    expect(result.invoiceStatusItems).toEqual([
      { status: 'PAID', count: 3, amount: 120000 },
      { status: 'DELAYED', count: 1, amount: 15000 },
      { status: 'WAITING', count: 2, amount: 30000 },
    ]);
    expect(result.reconciliation).toMatchObject({
      orderCount: 1,
      orderAmount: 100000,
      invoicedAmount: 90000,
      paidAmount: 70000,
      uninvoicedAmount: 10000,
      outstandingAmount: 30000,
    });
    expect(result.recentPayments[0]).toMatchObject({
      id: 'pay-1',
      invoice: { id: 'inv-1', code: 'INV-1' },
      company: { id: 'comp-1', name: 'ACME' },
      project: { id: 'proj-1', name: 'Main Project' },
    });
    expect(result.upcomingInvoices[0]).toMatchObject({
      id: 'inv-2',
      code: 'INV-2',
      company: { id: 'comp-2', name: 'Globex' },
    });
  });

  it('applies date filters to period-aware dashboard reads', async () => {
    prisma.invoice.count.mockResolvedValue(0);
    prisma.invoice.groupBy.mockResolvedValue([]);
    prisma.invoice.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 0 } })
      .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
      .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });
    prisma.subscription.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.subscription.count.mockResolvedValue(0);
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.order.findMany.mockResolvedValue([]);

    await service.getDashboardSummary({
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
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
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
