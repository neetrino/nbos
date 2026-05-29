import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceSummaryService } from './summary.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function emptyPayrollRunStats() {
  return {
    runCount: 0,
    totals: {
      totalBaseSalary: '0.00',
      totalBonuses: '0.00',
      totalPayable: '0.00',
      totalPaid: '0.00',
      totalRemaining: '0.00',
    },
    byStatus: [] as Array<{
      status: string;
      runCount: number;
      totalPayable: string;
      totalPaid: string;
      totalRemaining: string;
    }>,
  };
}

describe('FinanceSummaryService', () => {
  let service: FinanceSummaryService;
  let prisma: MockPrisma;
  let payrollMock: { getStats: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    payrollMock = { getStats: vi.fn().mockResolvedValue(emptyPayrollRunStats()) };
    service = new FinanceSummaryService(prisma as never, payrollMock as never);
  });

  it('returns finance dashboard summary from aggregate sources', async () => {
    prisma.invoice.count.mockResolvedValue(6);
    prisma.invoice.groupBy.mockResolvedValue([
      { moneyStatus: 'PAID', _count: 3, _sum: { amount: 120000 } },
      { moneyStatus: 'OVERDUE', _count: 1, _sum: { amount: 15000 } },
      { moneyStatus: 'AWAITING_PAYMENT', _count: 2, _sum: { amount: 30000 } },
    ]);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 120000 } });
    prisma.expense.findMany.mockResolvedValue([
      {
        amount: 50000,
        dueDate: daysFromToday(2),
        status: 'DUE_NOW',
        backlogReason: null,
        expensePayments: [{ amount: 15000 }],
      },
    ]);
    prisma.subscription.aggregate.mockResolvedValue({ _sum: { baseMonthlyAmount: 25000 } });
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
    prisma.invoice.findMany
      .mockResolvedValueOnce([
        {
          amount: 120000,
          dueDate: null,
          moneyStatus: 'PAID',
          payments: [{ amount: 120000 }],
        },
        {
          amount: 15000,
          dueDate: new Date('2020-04-25'),
          moneyStatus: 'OVERDUE',
          payments: [],
        },
        {
          amount: 30000,
          dueDate: daysFromToday(2),
          moneyStatus: 'AWAITING_PAYMENT',
          payments: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'inv-2',
          code: 'INV-2',
          amount: 30000,
          dueDate: daysFromToday(2),
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
      outstandingCount: 2,
      overdueAmount: 15000,
      overdueCount: 1,
      monthlyRecurringRevenue: 25000,
      activeSubscriptions: 4,
    });
    expect(result.invoiceStatusItems).toEqual([
      { status: 'PAID', count: 3, amount: 120000 },
      { status: 'OVERDUE', count: 1, amount: 15000 },
      { status: 'AWAITING_PAYMENT', count: 2, amount: 30000 },
    ]);
    expect(result.invoiceCards).toEqual({
      outstanding: { count: 2, amount: 45000 },
      overdue: { count: 1, amount: 15000 },
    });
    expect(result.expenseCards.dueNow).toEqual({ count: 1, amount: 35000 });
    expect(result.expenseCards.dueSoon).toEqual({ count: 0, amount: 0 });
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
    expect(result.payrollRuns).toEqual(emptyPayrollRunStats());
    expect(payrollMock.getStats).toHaveBeenCalledWith({});
  });

  it('applies date filters to period-aware dashboard reads', async () => {
    prisma.invoice.count.mockResolvedValue(0);
    prisma.invoice.groupBy.mockResolvedValue([]);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.expense.findMany.mockResolvedValue([]);
    prisma.subscription.aggregate.mockResolvedValue({ _sum: { baseMonthlyAmount: 0 } });
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
    expect(payrollMock.getStats).toHaveBeenCalledWith({});
  });
});

function daysFromToday(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return new Date(date.getTime() + days * ONE_DAY_MS);
}
