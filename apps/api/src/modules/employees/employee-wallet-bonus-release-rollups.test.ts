import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import { moneyAmount } from '../payroll-runs/payroll-allocation-source-amounts';
import {
  buildWalletReleaseRollups,
  plannedDecimalForEntry,
  type BonusReleaseForWalletRollup,
} from './employee-wallet-bonus-release-rollups';

const RELEASE_60 = moneyAmount(new Decimal('60000'));
const CASH_20 = moneyAmount(new Decimal('20000'));
const CASH_40 = moneyAmount(new Decimal('40000'));

function includedRelease(
  overrides: Partial<BonusReleaseForWalletRollup> = {},
): BonusReleaseForWalletRollup {
  return {
    id: 'rel-60',
    bonusEntryId: 'e1',
    amount: RELEASE_60,
    kpiBurnedAmount: null,
    kpiBurnedReason: null,
    payrollCarryOverAmount: null,
    status: 'INCLUDED_IN_PAYROLL',
    updatedAt: new Date('2026-04-28'),
    payrollRun: { payrollMonth: '2026-04' },
    ...overrides,
  };
}

describe('buildWalletReleaseRollups', () => {
  it('sums released and paid; remaining is planned minus paid', () => {
    const planned = new Map([['e1', new Decimal(1000)]]);
    const releases = [
      {
        id: 'rel-a',
        bonusEntryId: 'e1',
        amount: new Decimal(400),
        kpiBurnedAmount: null,
        kpiBurnedReason: null,
        payrollCarryOverAmount: null,
        status: 'APPROVED' as const,
        updatedAt: new Date('2026-01-02'),
        payrollRun: null,
      },
      {
        id: 'rel-p',
        bonusEntryId: 'e1',
        amount: new Decimal(300),
        kpiBurnedAmount: new Decimal(25),
        kpiBurnedReason: null,
        payrollCarryOverAmount: new Decimal(10),
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
    expect(roll?.kpiBurnedAmount.toFixed(2)).toBe('25.00');
    expect(roll?.payrollCarryOverAmount.toFixed(2)).toBe('10.00');
  });

  it('uses zero rollups when no releases', () => {
    const planned = new Map([['e1', new Decimal(50)]]);
    const roll = buildWalletReleaseRollups(planned, []).get('e1');
    expect(roll?.releasedAmount.toFixed(2)).toBe('0.00');
    expect(roll?.paidAmount.toFixed(2)).toBe('0.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('50.00');
    expect(roll?.payrollMonth).toBeNull();
  });

  it('counts attributed 20000 on an included 60000 release, not status-only PAID', () => {
    const planned = new Map([['e1', RELEASE_60]]);
    const attributed = new Map([['rel-60', CASH_20]]);
    const roll = buildWalletReleaseRollups(planned, [includedRelease()], attributed).get('e1');
    expect(roll?.paidAmount.toFixed(2)).toBe('20000.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('40000.00');
    expect(roll?.releasedAmount.toFixed(2)).toBe('60000.00');
  });

  it('does not treat an included 60000 release as fully paid after 20000 cash', () => {
    const planned = new Map([['e1', RELEASE_60]]);
    const attributed = new Map([['rel-60', CASH_20]]);
    const roll = buildWalletReleaseRollups(planned, [includedRelease()], attributed).get('e1');
    expect(roll?.paidAmount.toFixed(2)).not.toBe('0.00');
    expect(roll?.paidAmount.toFixed(2)).not.toBe('60000.00');
  });

  it('uses attributed 60000 after the remaining 40000 is paid', () => {
    const planned = new Map([['e1', RELEASE_60]]);
    const attributed = new Map([['rel-60', moneyAmount(CASH_20.plus(CASH_40))]]);
    const roll = buildWalletReleaseRollups(
      planned,
      [includedRelease({ status: 'PAID' })],
      attributed,
    ).get('e1');
    expect(roll?.paidAmount.toFixed(2)).toBe('60000.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('0.00');
  });

  it('returns wallet paid 0 after a 20000 bonus refund on the included release', () => {
    const planned = new Map([['e1', RELEASE_60]]);
    const attributed = new Map([['rel-60', moneyAmount(new Decimal(0))]]);
    const roll = buildWalletReleaseRollups(planned, [includedRelease()], attributed).get('e1');
    expect(roll?.paidAmount.toFixed(2)).toBe('0.00');
    expect(roll?.remainingAmount.toFixed(2)).toBe('60000.00');
  });
});

describe('plannedDecimalForEntry', () => {
  it('normalizes prisma amount', () => {
    expect(plannedDecimalForEntry(new Decimal('12.5')).toFixed(2)).toBe('12.50');
  });
});
