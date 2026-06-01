import { Decimal, type PrismaClient } from '@nbos/database';

import { isValidPayrollMonth } from '../payroll-runs/payroll-runs.constants';
import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';

export const BONUS_PAYOUT_FACTOR_ONE = new Decimal(1);

export type BonusPayableSnapshotDb = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'compensationProfile'
>;

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

async function loadKpiPayoutFactor(
  db: BonusPayableSnapshotDb,
  employeeId: string,
  earnedPeriod: string,
  kpiPolicyId: string,
): Promise<Decimal> {
  const row = await db.kpiResult.findFirst({
    where: { employeeId, period: earnedPeriod, kpiPolicyId },
    select: { payoutFactor: true },
    orderBy: { updatedAt: 'desc' },
  });
  return row?.payoutFactor ?? BONUS_PAYOUT_FACTOR_ONE;
}

/** Resolves KPI payout factor for a bonus entry (1 when no KPI policy or non-Sales). */
export async function resolveBonusPayoutFactor(
  db: BonusPayableSnapshotDb,
  entry: { type: string; employeeId: string; earnedPeriod: string | null },
): Promise<Decimal> {
  if (entry.type !== 'SALES') {
    return BONUS_PAYOUT_FACTOR_ONE;
  }

  const earnedPeriod = entry.earnedPeriod?.trim() ?? '';
  if (!isValidPayrollMonth(earnedPeriod)) {
    return BONUS_PAYOUT_FACTOR_ONE;
  }

  const profile = await db.compensationProfile.findFirst({
    where: { employeeId: entry.employeeId, status: 'ACTIVE' },
    select: { kpiPolicyId: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (profile?.kpiPolicyId == null) {
    return BONUS_PAYOUT_FACTOR_ONE;
  }

  return loadKpiPayoutFactor(db, entry.employeeId, earnedPeriod, profile.kpiPolicyId);
}

/** Writes kpiPayoutFactor + payableAmount from amount, factor, and payableAdjustment. */
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
  const amount = decimalFrom(entry.amount);
  const adjustment = decimalFrom(entry.payableAdjustment);
  const autoPayable = computeAutoPayable(amount, factor);
  const payableAmount = computePayableAmount(autoPayable, adjustment);

  await db.bonusEntry.update({
    where: { id: entry.id },
    data: {
      kpiPayoutFactor: factor,
      payableAmount,
      kpiGatePassed: factor.gt(0),
    },
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
