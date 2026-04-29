import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { ExpensePlanVsActualService } from './expense-plan-vs-actual.service';

describe('ExpensePlanVsActualService', () => {
  it('compares plans, generated cards and payments by category', async () => {
    const prisma = createMockPrisma();
    prisma.expensePlan.groupBy.mockResolvedValue([
      { category: 'HOSTING', _count: 2, _sum: { amount: new Decimal(500) } },
      { category: 'TOOLS', _count: 1, _sum: { amount: new Decimal(100) } },
    ]);
    prisma.expense.groupBy.mockResolvedValue([
      { category: 'HOSTING', _count: 1, _sum: { amount: new Decimal(300) } },
    ]);
    prisma.expensePayment.findMany.mockResolvedValue([
      { amount: new Decimal(120), expense: { category: 'HOSTING' } },
      { amount: new Decimal(50), expense: { category: 'TOOLS' } },
    ]);

    const report = await new ExpensePlanVsActualService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(report.totals).toEqual({
      plannedAmount: '600.00',
      generatedCardAmount: '300.00',
      paidAmount: '170.00',
      variancePlannedVsPaid: '430.00',
      planCount: 3,
      cardCount: 1,
      paymentCount: 2,
    });
    expect(report.byCategory).toEqual([
      {
        category: 'HOSTING',
        plannedAmount: '500.00',
        generatedCardAmount: '300.00',
        paidAmount: '120.00',
        variancePlannedVsPaid: '380.00',
        planCount: 2,
        cardCount: 1,
        paymentCount: 1,
      },
      {
        category: 'TOOLS',
        plannedAmount: '100.00',
        generatedCardAmount: '0.00',
        paidAmount: '50.00',
        variancePlannedVsPaid: '50.00',
        planCount: 1,
        cardCount: 0,
        paymentCount: 1,
      },
    ]);
  });
});
