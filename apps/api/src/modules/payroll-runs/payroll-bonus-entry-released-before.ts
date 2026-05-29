import { Decimal } from '@nbos/database';
import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';

export const PAYROLL_BONUS_RELEASE_LEDGER_STATUSES = [
  'DRAFT',
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
] as const;

export type PayrollBonusReleaseLedgerRow = {
  payrollRunId: string | null;
  status: string;
  amount: Decimal | string | number;
  payrollIncludedAmount?: Decimal | string | number | null;
};

/** Matches payroll matrix cell `releasedBefore` / `remaining` ledger rules. */
export function sumBonusEntryReleasedBefore(
  releases: PayrollBonusReleaseLedgerRow[],
  payrollRunId: string,
): Decimal {
  return releases
    .filter(
      (release) =>
        PAYROLL_BONUS_RELEASE_LEDGER_STATUSES.includes(
          release.status as (typeof PAYROLL_BONUS_RELEASE_LEDGER_STATUSES)[number],
        ) &&
        (release.payrollRunId !== payrollRunId || release.status === 'PAID'),
    )
    .reduce(
      (sum, release) => sum.plus(decimalFrom(release.payrollIncludedAmount ?? release.amount)),
      BONUS_POOL_ZERO,
    );
}
