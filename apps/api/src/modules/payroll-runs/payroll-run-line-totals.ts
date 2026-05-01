import { Decimal, type PrismaClient, type TransactionClient } from '@nbos/database';

function sumDecimal(value: Decimal | null | undefined): Decimal {
  return value ?? new Decimal(0);
}

type PayrollTotalsDb =
  | Pick<TransactionClient, 'salaryLine' | 'payrollRun'>
  | Pick<InstanceType<typeof PrismaClient>, 'salaryLine' | 'payrollRun'>;

/**
 * Recomputes `PayrollRun` roll-ups from current `SalaryLine` rows (base, bonus, payable, paid, etc.).
 */
export async function recalculatePayrollRunTotalsFromSalaryLines(
  db: PayrollTotalsDb,
  payrollRunId: string,
): Promise<void> {
  const sums = await db.salaryLine.aggregate({
    where: { payrollRunId },
    _sum: {
      baseSalary: true,
      bonusesTotal: true,
      adjustmentsTotal: true,
      deductionsTotal: true,
      totalPayable: true,
      paidAmount: true,
    },
  });

  await db.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      totalBaseSalary: sumDecimal(sums._sum.baseSalary),
      totalBonuses: sumDecimal(sums._sum.bonusesTotal),
      totalAdjustments: sumDecimal(sums._sum.adjustmentsTotal),
      totalDeductions: sumDecimal(sums._sum.deductionsTotal),
      totalPayable: sumDecimal(sums._sum.totalPayable),
      totalPaid: sumDecimal(sums._sum.paidAmount),
    },
  });
}
