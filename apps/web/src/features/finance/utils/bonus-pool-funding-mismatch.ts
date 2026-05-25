import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolTimelineEvent } from '@/lib/api/bonus';

/** Rounding tolerance when comparing payment sum vs ledger received. */
export const BONUS_POOL_FUNDING_MISMATCH_EPSILON = 0.01;

export type BonusPoolFundingMismatch = {
  hasMismatch: boolean;
  paymentsTotal: number;
  ledgerReceived: number;
};

export function sumBonusPoolPaymentInAmounts(events: readonly BonusPoolTimelineEvent[]): number {
  return events
    .filter((event) => event.kind === 'PAYMENT_IN')
    .reduce((sum, event) => sum + parseBonusPoolAmount(event.amount), 0);
}

/** True when client payment sum differs from pool ledger received (stale or bypassed sync). */
export function detectBonusPoolFundingMismatch(
  ledgerReceivedAmount: string | null | undefined,
  timelineEvents: readonly BonusPoolTimelineEvent[],
): BonusPoolFundingMismatch {
  const paymentsTotal = sumBonusPoolPaymentInAmounts(timelineEvents);
  const ledgerReceived = parseBonusPoolAmount(ledgerReceivedAmount);
  const hasMismatch =
    Math.abs(paymentsTotal - ledgerReceived) > BONUS_POOL_FUNDING_MISMATCH_EPSILON;
  return { hasMismatch, paymentsTotal, ledgerReceived };
}
