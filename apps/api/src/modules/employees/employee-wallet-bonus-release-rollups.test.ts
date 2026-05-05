import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import {
  buildWalletReleaseRollups,
  plannedDecimalForEntry,
} from './employee-wallet-bonus-release-rollups';

describe('buildWalletReleaseRollups', () => {
  it('sums released and paid; remaining is planned minus paid', () => {
    const planned = new Map([['e1', new Decimal(1000)]]);
    const releases = [
      {
        bonusEntryId: 'e1',
        amount: new Decimal(400),
        status: 'APPROVED' as const,
        updatedAt: new Date('2026-01-02'),
        payrollRun: null,
      },
      {
        bonusEntryId: 'e1',
        amount: new Decimal(300),
        status: 'PAID' as const,
        updatedAt: new Date('2026-01-05'),
        payrollRun: { payrollMonth: '2026-02' },
      },
    ];
    const roll = buildWalletReleaseRollups(planned, releases).get('e1');
    expect(roll?.releasedAmount.toFixed(2)).toBe('700.00');
    expect(roll?.paidAmount.toFixed(2)).toBe('300.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('700.00');
    expect(roll?.payrollMonth).toBe('2026-02');
  });

  it('uses zero rollups when no releases', () => {
    const planned = new Map([['e1', new Decimal(50)]]);
    const roll = buildWalletReleaseRollups(planned, []).get('e1');
    expect(roll?.releasedAmount.toFixed(2)).toBe('0.00');
    expect(roll?.paidAmount.toFixed(2)).toBe('0.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('50.00');
    expect(roll?.payrollMonth).toBeNull();
  });
});

describe('plannedDecimalForEntry', () => {
  it('normalizes prisma amount', () => {
    expect(plannedDecimalForEntry(new Decimal('12.5')).toFixed(2)).toBe('12.50');
  });
});
