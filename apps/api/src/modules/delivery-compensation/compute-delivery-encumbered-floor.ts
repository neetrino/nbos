import { Decimal } from '@nbos/database';

const COUNTING_RELEASE_STATUSES = ['DRAFT', 'APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID'] as const;

export type EncumberedReleaseRow = {
  amount: { toString(): string };
  status: string;
};

/**
 * Authoritative floor from existing ledger rows. A release is counted once.
 * Do not add the same row again as a payment.
 */
export function computeDeliveryEncumberedFloor(
  releases: readonly EncumberedReleaseRow[],
  retainedAcceptedAmount: { toString(): string } | string,
): string {
  let released = new Decimal(0);
  for (const row of releases) {
    if (
      !COUNTING_RELEASE_STATUSES.includes(row.status as (typeof COUNTING_RELEASE_STATUSES)[number])
    ) {
      continue;
    }
    released = released.plus(new Decimal(row.amount.toString()));
  }
  const retained = new Decimal(retainedAcceptedAmount.toString());
  const floor = Decimal.max(released, retained);
  return floor.toFixed(2);
}
