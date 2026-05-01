import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { CompanyPnlService } from './company-pnl.service';

describe('CompanyPnlService', () => {
  it('builds cash-basis Company P&L from payments and expense payments', async () => {
    const prisma = createMockPrisma();
    prisma.payment.count.mockResolvedValue(2);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(1000) } });
    prisma.expensePayment.findMany.mockResolvedValue([
      { amount: new Decimal(300), expense: { salaryLine: null } },
      { amount: new Decimal(200), expense: { salaryLine: { id: 'salary-line-1' } } },
    ]);
    prisma.payrollRun.count.mockResolvedValue(1);
    prisma.payrollRun.aggregate.mockResolvedValue({
      _sum: { totalPaid: new Decimal(200), totalPayable: new Decimal(500) },
    });

    const report = await new CompanyPnlService(prisma as never).getReport({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    });

    expect(report.period).toEqual({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
      basis: 'cash',
    });
    expect(report.revenue.incomingPayments).toBe('1000.00');
    expect(report.costs.actualExpensePayments).toBe('500.00');
    expect(report.costs.payrollExpensePayments).toBe('200.00');
    expect(report.costs.nonPayrollExpensePayments).toBe('300.00');
    expect(report.profitability.netProfit).toBe('500.00');
    expect(report.profitability.marginPercent).toBe(50);
  });

  it('keeps margin empty when revenue is zero', async () => {
    const prisma = createMockPrisma();
    prisma.expensePayment.findMany.mockResolvedValue([]);

    const report = await new CompanyPnlService(prisma as never).getReport();

    expect(report.profitability.marginPercent).toBeNull();
    expect(report.profitability.netProfit).toBe('0.00');
  });
});
