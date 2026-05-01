import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { PayrollReportService } from './payroll-report.service';

describe('PayrollReportService', () => {
  it('builds payroll totals, status rows and revenue ratio', async () => {
    const prisma = createMockPrisma();
    prisma.payrollRun.count.mockResolvedValue(2);
    prisma.payrollRun.aggregate.mockResolvedValue({
      _sum: {
        totalBaseSalary: new Decimal(700),
        totalBonuses: new Decimal(150),
        totalAdjustments: new Decimal(20),
        totalDeductions: new Decimal(10),
        totalPayable: new Decimal(860),
        totalPaid: new Decimal(500),
      },
    });
    prisma.payrollRun.groupBy.mockResolvedValue([
      {
        status: 'APPROVED',
        _count: 1,
        _sum: { totalPayable: new Decimal(600), totalPaid: new Decimal(400) },
      },
      {
        status: 'PAYING',
        _count: 1,
        _sum: { totalPayable: new Decimal(260), totalPaid: new Decimal(100) },
      },
    ]);
    prisma.salaryLine.count.mockResolvedValue(4);
    prisma.expensePayment.count.mockResolvedValue(3);
    prisma.expensePayment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(500) } });
    prisma.payment.count.mockResolvedValue(5);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(2000) } });

    const report = await new PayrollReportService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(report.totals).toEqual({
      payrollRunCount: 2,
      salaryLineCount: 4,
      totalBaseSalary: '700.00',
      totalBonuses: '150.00',
      totalAdjustments: '20.00',
      totalDeductions: '10.00',
      totalPayable: '860.00',
      totalPaid: '500.00',
      totalRemaining: '360.00',
      salaryExpensePaid: '500.00',
      payrollAsPercentOfRevenue: 43,
    });
    expect(report.byStatus).toEqual([
      {
        status: 'APPROVED',
        runCount: 1,
        totalPayable: '600.00',
        totalPaid: '400.00',
        totalRemaining: '200.00',
      },
      {
        status: 'PAYING',
        runCount: 1,
        totalPayable: '260.00',
        totalPaid: '100.00',
        totalRemaining: '160.00',
      },
    ]);
  });
});
