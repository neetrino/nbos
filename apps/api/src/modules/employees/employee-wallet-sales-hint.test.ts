import { describe, expect, it } from 'vitest';

import { employeeWalletSalesAccrualHint } from './employee-wallet-sales-hint';

describe('employeeWalletSalesAccrualHint', () => {
  it('returns null for delivery', () => {
    expect(employeeWalletSalesAccrualHint('DELIVERY', null, null)).toBeNull();
  });

  it('labels subscription recurring without slot', () => {
    expect(
      employeeWalletSalesAccrualHint('SALES', null, { paymentModel: 'SUBSCRIPTION_RECURRING' }),
    ).toBe('Subscription (month 2+)');
  });
});
