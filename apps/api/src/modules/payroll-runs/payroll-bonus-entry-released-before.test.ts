import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { sumBonusEntryReleasedBefore } from './payroll-bonus-entry-released-before';

describe('sumBonusEntryReleasedBefore', () => {
  it('sums payrollIncludedAmount and excludes current run included releases', () => {
    const total = sumBonusEntryReleasedBefore(
      [
        {
          payrollRunId: 'may',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(25_000),
          payrollIncludedAmount: new Decimal(25_000),
        },
        {
          payrollRunId: 'apr',
          status: 'PAID',
          amount: new Decimal(22_500),
          payrollIncludedAmount: new Decimal(22_500),
        },
      ],
      'may',
    );

    expect(total.toNumber()).toBe(22_500);
  });
});
