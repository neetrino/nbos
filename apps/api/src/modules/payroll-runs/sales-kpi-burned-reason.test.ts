import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { formatSalesKpiBurnedReason } from './sales-kpi-burned-reason';

describe('formatSalesKpiBurnedReason', () => {
  it('returns null when nothing burned', () => {
    expect(
      formatSalesKpiBurnedReason({
        bonusType: 'SALES',
        plan: new Decimal(1000),
        actual: new Decimal(800),
        payoutFactor: new Decimal(1),
        burnedAmount: null,
      }),
    ).toBeNull();
  });

  it('describes attainment and excluded amount', () => {
    const reason = formatSalesKpiBurnedReason({
      bonusType: 'SALES',
      plan: new Decimal(1000),
      actual: new Decimal(600),
      payoutFactor: new Decimal(0.5),
      burnedAmount: new Decimal(50),
    });
    expect(reason).toContain('60%');
    expect(reason).toContain('50% payout');
    expect(reason).toContain('50.00 excluded');
  });
});
