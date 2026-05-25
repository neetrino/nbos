import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

/** Client money counted toward the planned bonus pool (capped at planned). */
export function bonusPoolFundedAmount(row: BonusProductPoolRow): number {
  const planned = parseBonusPoolAmount(row.ledgerPlannedAmount);
  const received = parseBonusPoolAmount(row.ledgerReceivedAmount);
  if (planned <= 0) return received;
  return Math.min(planned, received);
}

/** Bonus amount that is both owed and funded — ready for release consideration. */
export function bonusPoolReleasableAmount(row: BonusProductPoolRow): number {
  const remaining = parseBonusPoolAmount(row.ledgerRemainingAmount);
  return Math.min(remaining, bonusPoolFundedAmount(row));
}

/** Pool fill toward planned bonus total (0–100). Prefer API field when capped. */
export function bonusPoolFundingFillPercent(row: BonusProductPoolRow): number | null {
  const planned = parseBonusPoolAmount(row.ledgerPlannedAmount);
  if (planned <= 0) {
    return bonusPoolFundedAmount(row) > 0 ? 100 : null;
  }
  const fromApi = row.fundingFillPercent;
  if (fromApi != null) {
    return Math.min(100, Math.max(0, fromApi));
  }
  return Math.min(100, Math.round((bonusPoolFundedAmount(row) / planned) * 100));
}
