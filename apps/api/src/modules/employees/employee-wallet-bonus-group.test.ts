import { describe, it, expect } from 'vitest';
import { mapBonusStatusToWalletGroup } from './employee-wallet-bonus-group';

describe('mapBonusStatusToWalletGroup', () => {
  it('maps incoming to potential', () => {
    expect(mapBonusStatusToWalletGroup('INCOMING')).toBe('POTENTIAL');
  });

  it('maps active to next payroll', () => {
    expect(mapBonusStatusToWalletGroup('ACTIVE')).toBe('NEXT_PAYROLL');
  });

  it('maps clawback to corrections', () => {
    expect(mapBonusStatusToWalletGroup('CLAWBACK')).toBe('CORRECTIONS');
  });
});
