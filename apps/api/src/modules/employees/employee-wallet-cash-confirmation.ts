import {
  plannedDecimalForEntry,
  type WalletReleaseRollup,
} from './employee-wallet-bonus-release-rollups';

export type WalletCashConfirmation = 'CONFIRMED' | 'UNCONFIRMED';

/** A PAID entry with no release and no cash is historical, not a confirmed zero. */
export function cashConfirmationFor(
  status: string,
  rollup: WalletReleaseRollup | undefined,
): WalletCashConfirmation {
  if (status !== 'PAID') {
    return 'CONFIRMED';
  }
  if (rollup != null && (rollup.releasedAmount.gt(0) || rollup.paidAmount.gt(0))) {
    return 'CONFIRMED';
  }
  return 'UNCONFIRMED';
}

/** Unconfirmed history is not an open remainder and is not the planned amount. */
export function remainingForWallet(
  status: string,
  planned: Parameters<typeof plannedDecimalForEntry>[0],
  rollup: WalletReleaseRollup | undefined,
): string {
  if (cashConfirmationFor(status, rollup) === 'UNCONFIRMED') {
    return '0.00';
  }
  return rollup?.remainingAmount.toFixed(2) ?? plannedDecimalForEntry(planned).toFixed(2);
}
