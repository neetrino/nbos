import { Decimal, type BonusReleaseStatusEnum } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import { BONUS_RELEASE_COUNTING_STATUSES } from '../bonus/product-bonus-pool.constants';

export interface BonusReleaseForWalletRollup {
  bonusEntryId: string;
  amount: Decimal;
  status: BonusReleaseStatusEnum;
  updatedAt: Date;
  payrollRun: { payrollMonth: string } | null;
}

export interface WalletReleaseRollup {
  releasedAmount: Decimal;
  paidAmount: Decimal;
  remainingAmount: Decimal;
  payrollMonth: string | null;
}

const COUNTING = new Set<string>(BONUS_RELEASE_COUNTING_STATUSES);

function rollupOneEntry(
  planned: Decimal,
  releases: BonusReleaseForWalletRollup[],
): WalletReleaseRollup {
  let released = BONUS_POOL_ZERO;
  let paid = BONUS_POOL_ZERO;

  for (const r of releases) {
    if (COUNTING.has(r.status)) {
      released = released.add(r.amount);
    }
    if (r.status === 'PAID') {
      paid = paid.add(r.amount);
    }
  }

  const remaining = Decimal.max(BONUS_POOL_ZERO, planned.minus(paid));
  const sorted = [...releases].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const payrollHit = sorted.find(
    (r) => r.payrollRun != null && (r.status === 'INCLUDED_IN_PAYROLL' || r.status === 'PAID'),
  );

  return {
    releasedAmount: released,
    paidAmount: paid,
    remainingAmount: remaining,
    payrollMonth: payrollHit?.payrollRun?.payrollMonth ?? null,
  };
}

/** Groups releases by bonus entry and computes wallet-facing totals (NBOS § Employee Wallet). */
export function buildWalletReleaseRollups(
  plannedByEntryId: Map<string, Decimal>,
  releases: BonusReleaseForWalletRollup[],
): Map<string, WalletReleaseRollup> {
  const byEntry = new Map<string, BonusReleaseForWalletRollup[]>();
  for (const r of releases) {
    const list = byEntry.get(r.bonusEntryId) ?? [];
    list.push(r);
    byEntry.set(r.bonusEntryId, list);
  }

  const out = new Map<string, WalletReleaseRollup>();
  for (const [entryId, planned] of plannedByEntryId) {
    const list = byEntry.get(entryId) ?? [];
    out.set(entryId, rollupOneEntry(planned, list));
  }
  return out;
}

export function plannedDecimalForEntry(
  amount: Decimal | number | string | null | undefined,
): Decimal {
  return decimalFrom(amount);
}
