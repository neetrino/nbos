import { describe, it, expect, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { syncSalaryLinePaidFromExpenseLedger } from './payroll-salary-line-ledger-sync';

function buildPrismaMock(payments: { amount: Decimal }[]) {
  const payrollRunUpdate = vi.fn().mockResolvedValue({});
  const salaryLineUpdate = vi.fn().mockResolvedValue({});
  const salaryLineAggregate = vi.fn().mockResolvedValue({
    _sum: {
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(0),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(100),
      paidAmount: sumPayments(payments),
    },
  });

  return {
    salaryLine: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'sl1',
        payrollRunId: 'pr1',
        totalPayable: new Decimal(100),
      }),
      update: salaryLineUpdate,
      aggregate: salaryLineAggregate,
    },
    expense: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'ex1',
        expensePayments: payments,
      }),
    },
    payrollRun: { update: payrollRunUpdate },
    _salaryLineUpdate: salaryLineUpdate,
    _payrollRunUpdate: payrollRunUpdate,
  };
}

function sumPayments(payments: { amount: Decimal }[]): Decimal {
  return payments.reduce((a, p) => a.plus(p.amount), new Decimal(0));
}

describe('syncSalaryLinePaidFromExpenseLedger', () => {
  it('no-ops when expense is not linked to a salary line', async () => {
    const prisma = {
      salaryLine: { findUnique: vi.fn().mockResolvedValue(null) },
      expense: { findUnique: vi.fn() },
      payrollRun: { update: vi.fn() },
    };
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex1');
    expect(prisma.expense.findUnique).not.toHaveBeenCalled();
  });

  it('sets PARTIALLY_PAID and remaining when partially paid', async () => {
    const prisma = buildPrismaMock([{ amount: new Decimal(40) }]);
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex1');

    expect(prisma._salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'sl1' },
      data: expect.objectContaining({
        paidAmount: new Decimal(40),
        remainingAmount: new Decimal(60),
        status: 'PARTIALLY_PAID',
      }),
    });
    expect(prisma._payrollRunUpdate).toHaveBeenCalled();
  });

  it('sets PAID when fully paid', async () => {
    const prisma = buildPrismaMock([{ amount: new Decimal(100) }]);
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex1');

    expect(prisma._salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'sl1' },
      data: expect.objectContaining({
        paidAmount: new Decimal(100),
        remainingAmount: new Decimal(0),
        status: 'PAID',
      }),
    });
  });

  it('sets APPROVED when all payments removed', async () => {
    const prisma = buildPrismaMock([]);
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex1');

    expect(prisma._salaryLineUpdate).toHaveBeenCalledWith({
      where: { id: 'sl1' },
      data: expect.objectContaining({
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(100),
        status: 'APPROVED',
      }),
    });
  });
});
