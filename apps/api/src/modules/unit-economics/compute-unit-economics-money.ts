import { Decimal } from '@nbos/database';
import type { Decimal as DecimalType } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';

/** Money sides for one delivery unit (bonuses are part of Out, not the hub). */
export type UnitEconomicsPoolSnapshot = {
  planned: DecimalType;
  released: DecimalType;
  paid: DecimalType;
  remaining: DecimalType;
};

export type UnitEconomicsMoneyComputed = {
  invoicedAmount: string;
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  plannedBonuses: string;
  releasedBonuses: string;
  paidBonuses: string;
  remainingBonuses: string;
  /** Cash after factual outflows (journal expenses on unit). */
  cashBalance: string;
  /** Factual outflows booked on the unit. */
  outFactAmount: string;
  /** Factual out + bonus plan still to pay. */
  outCommittedAmount: string;
  /** Received minus factual outflows. */
  marginFact: string;
  /** Received minus out committed (incl. remaining bonus plan). */
  marginAfterCommitments: string;
  /** Released bonuses above received cash (risk flag). */
  overReleaseAmount: string;
};

export function computeUnitEconomicsMoney(params: {
  invoiced: DecimalType;
  received: DecimalType;
  receivable: DecimalType;
  expensesPaid: DecimalType;
  pool: UnitEconomicsPoolSnapshot | null;
}): UnitEconomicsMoneyComputed {
  const planned = params.pool?.planned ?? BONUS_POOL_ZERO;
  const released = params.pool?.released ?? BONUS_POOL_ZERO;
  const paid = params.pool?.paid ?? BONUS_POOL_ZERO;
  const remaining = params.pool?.remaining ?? BONUS_POOL_ZERO;
  const outFact = params.expensesPaid;
  const outCommitted = outFact.plus(remaining);
  const cashBalance = params.received.minus(outFact);
  const marginFact = cashBalance;
  const marginAfterCommitments = params.received.minus(outCommitted);
  const overRelease = Decimal.max(BONUS_POOL_ZERO, released.minus(params.received));

  return {
    invoicedAmount: params.invoiced.toFixed(2),
    receivedAmount: params.received.toFixed(2),
    receivableAmount: params.receivable.toFixed(2),
    expensesPaidAmount: outFact.toFixed(2),
    plannedBonuses: planned.toFixed(2),
    releasedBonuses: released.toFixed(2),
    paidBonuses: paid.toFixed(2),
    remainingBonuses: remaining.toFixed(2),
    cashBalance: cashBalance.toFixed(2),
    outFactAmount: outFact.toFixed(2),
    outCommittedAmount: outCommitted.toFixed(2),
    marginFact: marginFact.toFixed(2),
    marginAfterCommitments: marginAfterCommitments.toFixed(2),
    overReleaseAmount: overRelease.toFixed(2),
  };
}

export function poolSnapshotFromRow(pool: {
  totalPlannedAmount: DecimalType | string | number | null;
  totalReleasedAmount: DecimalType | string | number | null;
  totalPaidAmount: DecimalType | string | number | null;
  totalRemainingAmount: DecimalType | string | number | null;
}): UnitEconomicsPoolSnapshot {
  return {
    planned: decimalFrom(pool.totalPlannedAmount),
    released: decimalFrom(pool.totalReleasedAmount),
    paid: decimalFrom(pool.totalPaidAmount),
    remaining: decimalFrom(pool.totalRemainingAmount),
  };
}
