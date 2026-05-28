import { Logger } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';

import { isValidPayrollMonth } from '../payroll-runs/payroll-runs.constants';
import { syncSalesKpiForEarnedPeriodEmployee } from '../payroll-runs/sync-sales-kpi-line';

const logger = new Logger('SalesBonusKpiPayable');

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'kpiPolicy' | 'compensationProfile' | 'payment'
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

async function resolveSalesKpiPayoutFactor(
  db: Db,
  employeeId: string,
  earnedPeriod: string,
): Promise<Decimal> {
  const profile = await db.compensationProfile.findFirst({
    where: { employeeId, status: 'ACTIVE' },
    select: { kpiPolicyId: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (profile?.kpiPolicyId == null) {
    return new Decimal(1);
  }

  return loadKpiPayoutFactor(db, employeeId, earnedPeriod, profile.kpiPolicyId);
}

/**
 * Writes payableAmount/kpiPayoutFactor on one Sales entry when month refresh skipped it
 * (e.g. status is EARNED rather than INCOMING).
 */
export async function applyPayableSnapshotToSalesEntry(
  db: Db,
  bonusEntryId: string,
): Promise<boolean> {
  const entry = await db.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: {
      id: true,
      type: true,
      employeeId: true,
      amount: true,
      earnedPeriod: true,
      payableAmount: true,
      kpiPayoutFactor: true,
    },
  });
  if (!entry || entry.type !== 'SALES') {
    return false;
  }
  if (entry.payableAmount != null && entry.kpiPayoutFactor != null) {
    return true;
  }
  const earnedPeriod = entry.earnedPeriod?.trim() ?? '';
  if (!isValidPayrollMonth(earnedPeriod)) {
    return false;
  }

  const factor = await resolveSalesKpiPayoutFactor(db, entry.employeeId, earnedPeriod);
  const payable = entry.amount.mul(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  await db.bonusEntry.update({
    where: { id: entry.id },
    data: {
      kpiPayoutFactor: factor,
      payableAmount: payable,
      kpiGatePassed: factor.gt(0),
    },
  });
  return true;
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

/** Repair: refresh payable snapshots for every employee with Sales entries in the month. */
export async function backfillSalesBonusPayablesForEarnedPeriod(
  db: Db,
  earnedPeriod: string,
): Promise<number> {
  const rows = await db.bonusEntry.findMany({
    where: { type: 'SALES', earnedPeriod },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) {
    await refreshSalesBonusesForEarnedMonth(db, { employeeId: row.employeeId, earnedPeriod });
  }
  return rows.length;
}
