import type { PrismaClient } from '@nbos/database';

import { earnedSalesPeriodForPayoutMonth } from './earned-sales-kpi-period';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { syncSalesKpiForEarnedPeriodEmployee } from './sync-sales-kpi-line';
import type { SalesKpiMonthCloseResultDto } from './sales-kpi-month-close.types';

function utcPayrollMonthNow(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Finalizes Sales KPI snapshots for the earned month (defaults to prior calendar month vs UTC today).
 * Intended for scheduler month-close; does not require a payroll run.
 */
export async function runSalesKpiMonthClose(
  prisma: InstanceType<typeof PrismaClient>,
  options?: { earnedPeriod?: string },
): Promise<SalesKpiMonthCloseResultDto> {
  const earnedPeriod =
    options?.earnedPeriod?.trim() ?? earnedSalesPeriodForPayoutMonth(utcPayrollMonthNow());
  if (!isValidPayrollMonth(earnedPeriod)) {
    throw new Error(`earnedPeriod must be YYYY-MM (received: ${earnedPeriod})`);
  }

  const profiles = await prisma.compensationProfile.findMany({
    where: {
      status: 'ACTIVE',
      kpiPolicyId: { not: null },
      employee: { status: { not: 'TERMINATED' } },
    },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });

  let syncedCount = 0;
  let skippedCount = 0;
  for (const row of profiles) {
    const synced = await syncSalesKpiForEarnedPeriodEmployee(prisma, {
      employeeId: row.employeeId,
      earnedPeriod,
    });
    if (synced) {
      syncedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return { earnedPeriod, syncedCount, skippedCount };
}
