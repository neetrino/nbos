import type { PrismaClient } from '@nbos/database';

/**
 * Counts salary lines per payroll run that already reference a materialized `Expense`
 * (`salary_lines.expense_id` set).
 */
export async function fetchMaterializedSalaryLineCountByPayrollRunId(
  prisma: InstanceType<typeof PrismaClient>,
  payrollRunIds: string[],
): Promise<Map<string, number>> {
  if (payrollRunIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.salaryLine.groupBy({
    by: ['payrollRunId'],
    where: {
      payrollRunId: { in: payrollRunIds },
      expenseId: { not: null },
    },
    _count: { _all: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.payrollRunId, row._count._all);
  }
  return map;
}
