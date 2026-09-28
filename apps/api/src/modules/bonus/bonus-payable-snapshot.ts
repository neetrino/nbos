import { Decimal, type PrismaClient } from '@nbos/database';

import { resolveCompensationProfileForPayrollMonth } from '../compensation-profiles/resolve-active-compensation-profile';
import { pickUniqueEmployeePeriodKpiResult } from '../payroll-runs/sales-kpi-period-result';
import { resolveSalesKpiPayoutFactorOrHold } from '../payroll-runs/sales-kpi-payroll-payout';
import { isValidPayrollMonth } from '../payroll-runs/payroll-runs.constants';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';

export const BONUS_PAYOUT_FACTOR_ONE = new Decimal(1);

export type BonusPayableSnapshotDb = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'compensationProfile'
>;

export type BonusPayableSnapshotFields = {
  kpiPayoutFactor: Decimal | null;
  payableAmount: Decimal | null;
  kpiGatePassed: boolean | null;
};

const entrySnapshotSelect = {
  id: true,
  type: true,
  employeeId: true,
  amount: true,
  earnedPeriod: true,
  payableAdjustment: true,
} as const;

/** Gross planned amount after KPI factor, before manual adjustment. */
export function computeAutoPayable(amount: Decimal, factor: Decimal): Decimal {
  return amount.mul(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Final Finance payable ceiling for payroll and releases. */
export function computePayableAmount(autoPayable: Decimal, adjustment: Decimal): Decimal {
  return Decimal.max(BONUS_POOL_ZERO, autoPayable.plus(adjustment)).toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP,
  );
}

/**
 * Sales snapshot fields. Null factor holds the bonus (not a payout of 1 or 0).
 */
export function buildPayableSnapshotFields(params: {
  amount: Decimal;
  adjustment: Decimal;
  factor: Decimal | null;
}): BonusPayableSnapshotFields {
  if (params.factor == null) {
    return { kpiPayoutFactor: null, payableAmount: null, kpiGatePassed: null };
  }
  return {
    kpiPayoutFactor: params.factor,
    payableAmount: computePayableAmount(
      computeAutoPayable(params.amount, params.factor),
      params.adjustment,
    ),
    kpiGatePassed: params.factor.gt(0),
  };
}

async function loadSalesKpiPayoutFactorOrHold(
  db: BonusPayableSnapshotDb,
  employeeId: string,
  earnedPeriod: string,
): Promise<Decimal | null> {
  const rows = await db.kpiResult.findMany({
    where: { employeeId, period: earnedPeriod },
    select: { planAmount: true, actualAmount: true },
  });
  const row = pickUniqueEmployeePeriodKpiResult(rows);
  if (row == null) {
    return null;
  }
  return resolveSalesKpiPayoutFactorOrHold(row.planAmount, row.actualAmount);
}

/**
 * Non-Sales stays at factor 1. Missing Sales facts (no unique result, no plan,
 * no actual, invalid month, or no month KPI policy) hold — null, not 1 or 0.
 */
export async function resolveBonusPayoutFactor(
  db: BonusPayableSnapshotDb,
  entry: { type: string; employeeId: string; earnedPeriod: string | null },
): Promise<Decimal | null> {
  if (entry.type !== 'SALES') {
    return BONUS_PAYOUT_FACTOR_ONE;
  }

  const earnedPeriod = entry.earnedPeriod?.trim() ?? '';
  if (!isValidPayrollMonth(earnedPeriod)) {
    return null;
  }

  const profile = await resolveCompensationProfileForPayrollMonth(
    db,
    entry.employeeId,
    earnedPeriod,
  );
  if (profile?.kpiPolicyId == null) {
    return null;
  }

  return loadSalesKpiPayoutFactorOrHold(db, entry.employeeId, earnedPeriod);
}

/** Writes kpiPayoutFactor + payableAmount, or clears them when Sales KPI is held. */
export async function applyPayableSnapshotToBonusEntry(
  db: BonusPayableSnapshotDb,
  bonusEntryId: string,
): Promise<boolean> {
  const entry = await db.bonusEntry.findUnique({
    where: { id: bonusEntryId },
    select: entrySnapshotSelect,
  });
  if (!entry) {
    return false;
  }

  const factor = await resolveBonusPayoutFactor(db, entry);
  await db.bonusEntry.update({
    where: { id: entry.id },
    data: buildPayableSnapshotFields({
      amount: decimalFrom(entry.amount),
      adjustment: decimalFrom(entry.payableAdjustment),
      factor,
    }),
  });
  return true;
}

/** Recompute payable snapshots for many entries (e.g. after backfill). */
export async function backfillPayableSnapshotsForEntries(
  db: BonusPayableSnapshotDb,
  bonusEntryIds: string[],
): Promise<number> {
  let updated = 0;
  for (const id of bonusEntryIds) {
    const ok = await applyPayableSnapshotToBonusEntry(db, id);
    if (ok) updated += 1;
  }
  return updated;
}
