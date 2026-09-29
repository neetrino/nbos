import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import { cashConfirmationFor, remainingForWallet } from './employee-wallet-cash-confirmation';
import type { WalletReleaseRollup } from './employee-wallet-bonus-release-rollups';

const ZERO = new Decimal(0);

function rollup(released: string, paid: string): WalletReleaseRollup {
  return {
    releasedAmount: new Decimal(released),
    paidAmount: new Decimal(paid),
    remainingAmount: new Decimal(released).minus(paid),
    kpiBurnedAmount: ZERO,
    kpiBurnedReason: null,
    payrollCarryOverAmount: ZERO,
    payrollMonth: null,
  };
}

describe('wallet cash confirmation', () => {
  it('does not treat a PAID entry without a release as confirmed zero or as still due', () => {
    expect(cashConfirmationFor('PAID', undefined)).toBe('UNCONFIRMED');
    expect(remainingForWallet('PAID', '20000', undefined)).toBe('0.00');
  });

  it('keeps confirmed cash, including a real zero after a release existed', () => {
    expect(cashConfirmationFor('PAID', rollup('60000', '40000'))).toBe('CONFIRMED');
    expect(cashConfirmationFor('PAID', rollup('60000', '0'))).toBe('CONFIRMED');
    expect(remainingForWallet('ACTIVE', '20000', undefined)).toBe('20000.00');
  });
});
