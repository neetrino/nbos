import { Decimal } from '@nbos/database';

export type BonusPoolFundingHealth = 'EMPTY' | 'PARTIAL' | 'READY' | 'OVER' | 'CLOSED' | 'UNKNOWN';

export type BonusPoolFundingMetrics = {
  fundingFillPercent: number | null;
  fundingHealth: BonusPoolFundingHealth;
};

const ZERO = new Decimal(0);

function toNumber(value: Decimal | null | undefined): number {
  if (value == null) return 0;
  return value.toNumber();
}

/** Client money counted toward planned bonus pool (never above planned). */
export function fundedTowardPlanned(planned: number, received: number): number {
  if (planned <= 0) return received;
  return Math.min(planned, received);
}

/** Bonus owed that is already funded from client payments. */
export function releasableBonusAmount(
  planned: number,
  received: number,
  remaining: number,
): number {
  return Math.min(remaining, fundedTowardPlanned(planned, received));
}

/**
 * Fill % = funded toward planned bonus pool (capped at 100 for UI).
 * Health drives list/board/sheet indicators (NBOS product bonus pool funding).
 */
export function deriveBonusPoolFundingMetrics(input: {
  planned: Decimal | null;
  received: Decimal | null;
  available: Decimal | null;
  remaining: Decimal | null;
  overFunding: Decimal | null;
  ledgerStatus: string | null;
}): BonusPoolFundingMetrics {
  const plannedN = toNumber(input.planned);
  const receivedN = toNumber(input.received);
  const remainingN = toNumber(input.remaining);
  const overN = toNumber(input.overFunding);
  const status = input.ledgerStatus?.toUpperCase() ?? null;
  const fundedN = fundedTowardPlanned(plannedN, receivedN);

  if (input.planned == null && input.received == null) {
    return { fundingFillPercent: null, fundingHealth: 'UNKNOWN' };
  }

  let fundingFillPercent: number | null = null;
  if (plannedN > 0) {
    fundingFillPercent = Math.min(100, Math.round((fundedN / plannedN) * 100));
  } else if (receivedN > 0) {
    fundingFillPercent = 100;
  }

  if (overN > 0) {
    return { fundingFillPercent, fundingHealth: 'OVER' };
  }
  if (status === 'CLOSED' || (plannedN > 0 && remainingN <= 0)) {
    return { fundingFillPercent, fundingHealth: 'CLOSED' };
  }
  if (plannedN <= 0 && receivedN <= 0) {
    return { fundingFillPercent, fundingHealth: 'UNKNOWN' };
  }
  if (fundedN <= 0 && remainingN > 0) {
    return { fundingFillPercent, fundingHealth: 'EMPTY' };
  }
  if (plannedN > 0 && fundedN >= plannedN && remainingN > 0) {
    return { fundingFillPercent, fundingHealth: 'READY' };
  }
  if (fundedN > 0 && (plannedN <= 0 || fundedN < plannedN)) {
    return { fundingFillPercent, fundingHealth: 'PARTIAL' };
  }
  if (receivedN > 0 || status === 'PARTIALLY_RELEASED') {
    return { fundingFillPercent, fundingHealth: 'PARTIAL' };
  }
  return { fundingFillPercent, fundingHealth: 'EMPTY' };
}

/** Sums ledger money fields across multiple order-level pool rows. */
export function sumPoolLedgerFields(
  ledgers: readonly {
    totalPlannedAmount: Decimal;
    totalReleasedAmount: Decimal;
    totalRemainingAmount: Decimal;
    availableFunding: Decimal;
    overFundingAmount: Decimal;
    status: string;
  }[],
): {
  planned: Decimal;
  released: Decimal;
  remaining: Decimal;
  available: Decimal;
  overFunding: Decimal;
  received: Decimal;
  ledgerStatus: string | null;
} {
  if (ledgers.length === 0) {
    return {
      planned: ZERO,
      released: ZERO,
      remaining: ZERO,
      available: ZERO,
      overFunding: ZERO,
      received: ZERO,
      ledgerStatus: null,
    };
  }
  let planned = ZERO;
  let released = ZERO;
  let remaining = ZERO;
  let available = ZERO;
  let overFunding = ZERO;
  for (const row of ledgers) {
    planned = planned.plus(row.totalPlannedAmount);
    released = released.plus(row.totalReleasedAmount);
    remaining = remaining.plus(row.totalRemainingAmount);
    available = available.plus(row.availableFunding);
    overFunding = overFunding.plus(row.overFundingAmount);
  }
  const received = available.plus(released).minus(overFunding);
  const ledgerStatus = pickMergedLedgerStatus(ledgers.map((l) => l.status));
  return { planned, released, remaining, available, overFunding, received, ledgerStatus };
}

function pickMergedLedgerStatus(statuses: string[]): string | null {
  const upper = statuses.map((s) => s.toUpperCase());
  if (upper.some((s) => s === 'ACTIVE' && statuses.length > 1)) {
    return 'PARTIALLY_RELEASED';
  }
  if (upper.every((s) => s === 'CLOSED')) return 'CLOSED';
  if (upper.some((s) => s === 'PARTIALLY_RELEASED')) return 'PARTIALLY_RELEASED';
  if (upper.some((s) => s === 'ACTIVE')) return 'ACTIVE';
  return statuses[0] ?? null;
}
