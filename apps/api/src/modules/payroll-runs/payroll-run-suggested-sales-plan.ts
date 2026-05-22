import { Decimal, type PrismaClient } from '@nbos/database';

import { decimalFrom, BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';

import { parsePayrollMonthToUtcRange } from './payroll-run-suggested-sales-actual';

/** Previous calendar month key `YYYY-MM`, or null when `payrollMonth` is invalid. */
export function previousPayrollMonth(payrollMonth: string): string | null {
  const range = parsePayrollMonthToUtcRange(payrollMonth);
  if (!range) {
    return null;
  }
  const prev = new Date(Date.UTC(range.gte.getUTCFullYear(), range.gte.getUTCMonth() - 1, 1));
  const year = prev.getUTCFullYear();
  const month = String(prev.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Suggested sales plan per employee: prior payroll month line override, else that run's
 * default plan. Used until KPI Plan entities exist (NBOS scorecard backlog).
 */
export async function resolveSuggestedSalesPlanByEmployee(
  prisma: PrismaClient,
  payrollMonth: string,
  employeeIds: string[],
): Promise<Map<string, Decimal>> {
  const totals = new Map<string, Decimal>();
  const unique = [...new Set(employeeIds)].filter((id) => id.length > 0);
  for (const id of unique) {
    totals.set(id, BONUS_POOL_ZERO);
  }
  if (unique.length === 0) {
    return totals;
  }

  const priorMonth = previousPayrollMonth(payrollMonth);
  if (priorMonth == null) {
    return totals;
  }

  const priorRun = await prisma.payrollRun.findUnique({
    where: { payrollMonth: priorMonth },
    select: {
      kpiSalesPlanAmount: true,
      salaryLines: {
        where: { employeeId: { in: unique } },
        select: { employeeId: true, kpiSalesPlanAmount: true },
      },
    },
  });
  if (priorRun == null) {
    return totals;
  }

  const runDefault =
    priorRun.kpiSalesPlanAmount != null ? decimalFrom(priorRun.kpiSalesPlanAmount) : null;

  for (const employeeId of unique) {
    const line = priorRun.salaryLines.find((row) => row.employeeId === employeeId);
    const linePlan = line?.kpiSalesPlanAmount != null ? decimalFrom(line.kpiSalesPlanAmount) : null;
    const resolved = linePlan ?? runDefault;
    if (resolved != null && resolved.gt(0)) {
      totals.set(employeeId, resolved);
    }
  }

  return totals;
}

/** Run-level hint: prior month's `kpiSalesPlanAmount` when that payroll run exists. */
export async function resolvePriorPayrollRunSalesPlanAmount(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<Decimal | null> {
  const priorMonth = previousPayrollMonth(payrollMonth);
  if (priorMonth == null) {
    return null;
  }
  const priorRun = await prisma.payrollRun.findUnique({
    where: { payrollMonth: priorMonth },
    select: { kpiSalesPlanAmount: true },
  });
  if (priorRun?.kpiSalesPlanAmount == null) {
    return null;
  }
  const plan = decimalFrom(priorRun.kpiSalesPlanAmount);
  return plan.gt(0) ? plan : null;
}
