import { Logger } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';

import { isValidPayrollMonth } from '../payroll-runs/payroll-runs.constants';
import { syncSalesKpiForEarnedPeriodEmployee } from '../payroll-runs/sync-sales-kpi-line';

const logger = new Logger('SalesBonusKpiPayable');

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'kpiPolicy' | 'compensationProfile'
>;

/** Calendar earned month (UTC) for a payment or accrual timestamp. */
export function earnedPeriodFromUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Open Sales entries for an earned month (not yet on payroll). */
function openSalesEntryFilter(employeeId: string, earnedPeriod: string) {
  return {
    employeeId,
    type: 'SALES' as const,
    earnedPeriod,
    status: 'INCOMING' as const,
    bonusReleases: {
      none: { status: { in: ['INCLUDED_IN_PAYROLL' as const, 'PAID' as const] } },
    },
  };
}

async function loadKpiPayoutFactor(
  db: Db,
  employeeId: string,
  earnedPeriod: string,
  kpiPolicyId: string,
): Promise<Decimal> {
  const row = await db.kpiResult.findFirst({
    where: { employeeId, period: earnedPeriod, kpiPolicyId },
    select: { payoutFactor: true },
    orderBy: { updatedAt: 'desc' },
  });
  return row?.payoutFactor ?? new Decimal(1);
}

/**
 * Syncs month KPI from payment facts, then updates payable on all open Sales bonuses
 * for that employee and earned month (one KPI % for the whole month).
 */
export async function refreshSalesBonusesForEarnedMonth(
  db: Db,
  params: { employeeId: string; earnedPeriod: string },
): Promise<void> {
  const earnedPeriod = params.earnedPeriod.trim();
  if (!isValidPayrollMonth(earnedPeriod)) {
    return;
  }

  try {
    await syncSalesKpiForEarnedPeriodEmployee(db, {
      employeeId: params.employeeId,
      earnedPeriod,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    logger.warn(`KpiResult sync failed for ${params.employeeId} ${earnedPeriod}: ${message}`);
  }

  const profile = await db.compensationProfile.findFirst({
    where: { employeeId: params.employeeId, status: 'ACTIVE' },
    select: { kpiPolicyId: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  const factor =
    profile?.kpiPolicyId != null
      ? await loadKpiPayoutFactor(db, params.employeeId, earnedPeriod, profile.kpiPolicyId)
      : new Decimal(1);

  const entries = await db.bonusEntry.findMany({
    where: openSalesEntryFilter(params.employeeId, earnedPeriod),
    select: { id: true, amount: true },
  });

  for (const entry of entries) {
    const payable = entry.amount.mul(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    await db.bonusEntry.update({
      where: { id: entry.id },
      data: {
        kpiPayoutFactor: factor,
        payableAmount: payable,
        kpiGatePassed: factor.gt(0),
      },
    });
  }
}

export async function refreshSalesBonusesForEmployeesEarnedMonth(
  db: Db,
  employeeIds: string[],
  earnedPeriod: string,
): Promise<void> {
  const unique = [...new Set(employeeIds.filter((id) => id.length > 0))];
  for (const employeeId of unique) {
    await refreshSalesBonusesForEarnedMonth(db, { employeeId, earnedPeriod });
  }
}
