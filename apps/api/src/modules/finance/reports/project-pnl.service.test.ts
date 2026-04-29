import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { ProjectPnlService } from './project-pnl.service';

describe('ProjectPnlService', () => {
  it('builds cash-driven Project P&L rows and totals', async () => {
    const prisma = createMockPrisma();
    prisma.payment.findMany.mockResolvedValue([
      { amount: new Decimal(1000), invoice: { projectId: 'project-a' } },
      { amount: new Decimal(400), invoice: { projectId: 'project-b' } },
    ]);
    prisma.expensePayment.findMany.mockResolvedValue([
      { amount: new Decimal(300), expense: { projectId: 'project-a' } },
      { amount: new Decimal(100), expense: { projectId: 'project-b' } },
      { amount: new Decimal(50), expense: { projectId: null } },
    ]);
    prisma.project.findMany.mockResolvedValue([
      { id: 'project-a', code: 'PRJ-A', name: 'Project Alpha' },
      { id: 'project-b', code: 'PRJ-B', name: 'Project Beta' },
    ]);

    const report = await new ProjectPnlService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(report.totals).toEqual({
      projectCount: 2,
      revenue: '1400.00',
      actualCosts: '400.00',
      netProfit: '1000.00',
      marginPercent: 71.43,
      paymentCount: 2,
      expensePaymentCount: 2,
    });
    expect(report.topProjects).toEqual([
      {
        projectId: 'project-a',
        projectCode: 'PRJ-A',
        projectName: 'Project Alpha',
        revenue: '1000.00',
        actualCosts: '300.00',
        netProfit: '700.00',
        marginPercent: 70,
        paymentCount: 1,
        expensePaymentCount: 1,
      },
      {
        projectId: 'project-b',
        projectCode: 'PRJ-B',
        projectName: 'Project Beta',
        revenue: '400.00',
        actualCosts: '100.00',
        netProfit: '300.00',
        marginPercent: 75,
        paymentCount: 1,
        expensePaymentCount: 1,
      },
    ]);
  });
});
