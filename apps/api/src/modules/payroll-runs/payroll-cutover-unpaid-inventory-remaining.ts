import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount } from './payroll-allocation-source-amounts';
import { resolveConsumedPayrollCarryOver } from './payroll-bonus-cap';
import type {
  CutoverBonusEntrySnapshot,
  CutoverBonusReleaseSnapshot,
} from './payroll-cutover-unpaid-inventory.types';

export function remainingAfterCash(planned: Decimal, paid: Decimal): Decimal {
  return moneyAmount(Decimal.max(BONUS_POOL_ZERO, planned.minus(paid)));
}

export function attributedCashForEntry(
  entryId: string,
  releases: readonly CutoverBonusReleaseSnapshot[],
  attributed: ReadonlyMap<string, Decimal>,
): Decimal {
  let paid = BONUS_POOL_ZERO;
  for (const release of releases) {
    if (release.bonusEntryId !== entryId) {
      continue;
    }
    paid = paid.plus(attributed.get(release.id) ?? BONUS_POOL_ZERO);
  }
  return moneyAmount(paid);
}

/** Included remaining uses payrollIncludedAmount when present, not only release.amount. */
export function includedReleasePlanned(release: CutoverBonusReleaseSnapshot): Decimal {
  if (release.payrollIncludedAmount != null) {
    return moneyAmount(release.payrollIncludedAmount);
  }
  return moneyAmount(release.amount);
}

export function includedRemainingForRelease(
  release: CutoverBonusReleaseSnapshot,
  attributed: ReadonlyMap<string, Decimal>,
): Decimal {
  if (release.status !== 'INCLUDED_IN_PAYROLL') {
    return BONUS_POOL_ZERO;
  }
  const paid = moneyAmount(attributed.get(release.id) ?? BONUS_POOL_ZERO);
  return remainingAfterCash(includedReleasePlanned(release), paid);
}

export function leftoverUnconsumedCarry(release: CutoverBonusReleaseSnapshot): Decimal {
  const remembered = release.payrollCarryOverAmount;
  if (remembered == null || remembered.lte(BONUS_POOL_ZERO)) {
    return BONUS_POOL_ZERO;
  }
  return remainingAfterCash(moneyAmount(remembered), consumedSalaryCapCarry(release));
}

/**
 * Carry already applied to a later salary line. Uses stored remaining, not a new FIFO.
 * Null remaining on a positive original carry means the later month used all of it.
 */
export function consumedSalaryCapCarry(release: CutoverBonusReleaseSnapshot): Decimal {
  const remembered = release.payrollCarryOverAmount;
  if (remembered == null || remembered.lte(BONUS_POOL_ZERO)) {
    return BONUS_POOL_ZERO;
  }
  return moneyAmount(
    resolveConsumedPayrollCarryOver({
      payrollCarryOverAmount: remembered,
      payrollCarryOverRemaining: release.payrollCarryOverRemaining,
    }),
  );
}

export function isIncludedOnOpenRun(release: CutoverBonusReleaseSnapshot): boolean {
  return release.status === 'INCLUDED_IN_PAYROLL' && isOpenPayrollRun(release);
}

export function isOpenPayrollRun(release: CutoverBonusReleaseSnapshot): boolean {
  return release.payrollRun != null && release.payrollRun.status !== 'CLOSED';
}

/**
 * KPI-burned slice only. Leftover and consumed salary-cap carry are subtracted
 * first so the same 70,000 is not treated as burned and as carry.
 */
export function burnedAlreadyListed(
  release: CutoverBonusReleaseSnapshot,
  entryAmount?: Decimal,
): Decimal {
  const leftover = leftoverUnconsumedCarry(release);
  const consumed = consumedSalaryCapCarry(release);
  const carryAlready = moneyAmount(leftover.plus(consumed));
  const fromGap = burnedAfterCarryExcluded(release, carryAlready);
  const burned = largerBurnIfNotCarry(release, fromGap, carryAlready);
  return capBurnedToEntry(release, burned, entryAmount);
}

function burnedAfterCarryExcluded(
  release: CutoverBonusReleaseSnapshot,
  carryAlready: Decimal,
): Decimal {
  if (release.payrollIncludedAmount == null) {
    return BONUS_POOL_ZERO;
  }
  return remainingAfterCash(
    moneyAmount(release.amount),
    moneyAmount(release.payrollIncludedAmount).plus(carryAlready),
  );
}

function largerBurnIfNotCarry(
  release: CutoverBonusReleaseSnapshot,
  fromGap: Decimal,
  carryAlready: Decimal,
): Decimal {
  const fromColumn =
    release.kpiBurnedAmount != null && release.kpiBurnedAmount.gt(BONUS_POOL_ZERO)
      ? moneyAmount(release.kpiBurnedAmount)
      : BONUS_POOL_ZERO;
  if (fromColumn.lte(fromGap) || fromColumn.eq(carryAlready)) {
    return fromGap;
  }
  return fromColumn;
}

function capBurnedToEntry(
  release: CutoverBonusReleaseSnapshot,
  burned: Decimal,
  entryAmount?: Decimal,
): Decimal {
  if (entryAmount == null || release.payrollIncludedAmount == null) {
    return burned;
  }
  const room = remainingAfterCash(moneyAmount(entryAmount), includedReleasePlanned(release));
  return moneyAmount(Decimal.min(burned, room));
}

/** Amounts already leftover, consumed, burned, or included on an open run. */
export function listedElsewhereForEntry(
  entries: readonly CutoverBonusEntrySnapshot[],
  releases: readonly CutoverBonusReleaseSnapshot[],
  attributed: ReadonlyMap<string, Decimal>,
): Map<string, Decimal> {
  const listed = new Map<string, Decimal>();
  const plannedByEntry = new Map(entries.map((entry) => [entry.id, entry.amount]));
  for (const release of releases) {
    addListed(listed, release.bonusEntryId, leftoverUnconsumedCarry(release));
    addListed(listed, release.bonusEntryId, consumedSalaryCapCarry(release));
    addListed(
      listed,
      release.bonusEntryId,
      burnedAlreadyListed(release, plannedByEntry.get(release.bonusEntryId)),
    );
    if (!isIncludedOnOpenRun(release)) {
      continue;
    }
    addListed(listed, release.bonusEntryId, includedRemainingForRelease(release, attributed));
  }
  return listed;
}

function addListed(listed: Map<string, Decimal>, entryId: string, amount: Decimal): void {
  if (amount.lte(BONUS_POOL_ZERO)) {
    return;
  }
  const previous = listed.get(entryId) ?? BONUS_POOL_ZERO;
  listed.set(entryId, moneyAmount(previous.plus(amount)));
}
