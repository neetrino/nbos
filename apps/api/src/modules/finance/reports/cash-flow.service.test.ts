import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CashFlowService } from './cash-flow.service';

describe('CashFlowService', () => {
  it('builds actual movement, forecast buckets and backlog separately', async () => {
    const prisma = createMockPrisma();
    prisma.payment.count.mockResolvedValue(2);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(1000) } });
    prisma.expensePayment.count.mockResolvedValue(1);
    prisma.expensePayment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(300) } });
    prisma.invoice.findMany.mockResolvedValue([
      { amount: new Decimal(500), dueDate: new Date('2026-05-10'), payments: [] },
      {
        amount: new Decimal(400),
        dueDate: new Date('2026-06-20'),
        payments: [{ amount: new Decimal(100) }],
      },
    ]);
    prisma.expense.findMany
      .mockResolvedValueOnce([
        { amount: new Decimal(200), dueDate: new Date('2026-05-15'), expensePayments: [] },
      ])
      .mockResolvedValueOnce([
        { amount: new Decimal(150), expensePayments: [{ amount: new Decimal(50) }] },
      ]);
    prisma.expensePlan.findMany.mockResolvedValue([
      { amount: new Decimal(80), nextDueDate: new Date('2026-05-20') },
    ]);
    prisma.payrollRun.findMany.mockResolvedValue([
      {
        payrollMonth: '2026-05',
        totalPayable: new Decimal(600),
        totalPaid: new Decimal(100),
      },
    ]);

    const report = await new CashFlowService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      asOf: '2026-05-01',
    });

    expect(report.actuals).toMatchObject({
      realIncoming: '1000.00',
      realOutgoing: '300.00',
      netMovement: '700.00',
    });
    expect(report.forecast.expectedIncomingOpenInvoices).toBe('800.00');
    expect(report.forecast.expectedOutgoingExpenseCards).toBe('200.00');
    expect(report.forecast.expectedOutgoingExpensePlans).toBe('80.00');
    expect(report.forecast.expectedOutgoingPayroll).toBe('500.00');
    expect(report.forecast.buckets[0]).toEqual({
      horizonDays: 30,
      expectedIncoming: '500.00',
      expectedOutgoing: '780.00',
      netExpected: '-280.00',
    });
    expect(report.backlogDebt).toEqual({ amount: '100.00', expenseCount: 1 });
  });
});
