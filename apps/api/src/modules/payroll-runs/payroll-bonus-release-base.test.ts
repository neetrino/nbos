import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  isPayrollMatrixBonusEntryVisible,
  isSalesBonusEligibleForPayrollMonth,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';

describe('payrollBonusReleaseBase', () => {
  it('uses payableAmount for eligible SALES entries', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'SALES',
          amount: new Decimal(100_000),
          payableAmount: new Decimal(70_000),
          earnedPeriod: '2026-04',
        },
        '2026-05',
      ).toString(),
    ).toBe('70000');
  });

  it('returns zero for SALES from the wrong earned month', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'SALES',
          amount: new Decimal(100_000),
          payableAmount: new Decimal(70_000),
          earnedPeriod: '2026-05',
        },
        '2026-05',
      ).isZero(),
    ).toBe(true);
  });

  it('uses payableAmount for delivery entries', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'DELIVERY',
          amount: new Decimal(50_000),
          payableAmount: new Decimal(55_000),
        },
        '2026-05',
      ).toString(),
    ).toBe('55000');
  });

  it('falls back to amount when payableAmount is missing', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'DELIVERY',
          amount: new Decimal(50_000),
          payableAmount: null,
        },
        '2026-05',
      ).toString(),
    ).toBe('50000');
  });
});

describe('isSalesBonusEligibleForPayrollMonth', () => {
  it('matches payroll month minus one', () => {
    expect(
      isSalesBonusEligibleForPayrollMonth({ type: 'SALES', earnedPeriod: '2026-04' }, '2026-05'),
    ).toBe(true);
  });
});

describe('isPayrollMatrixBonusEntryVisible', () => {
  it('hides SALES until payable snapshot exists', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'SALES',
          amount: new Decimal(100),
          payableAmount: null,
          earnedPeriod: '2026-04',
        },
        '2026-05',
      ),
    ).toBe(false);
  });

  it('shows SALES when payable snapshot exists', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'SALES',
          amount: new Decimal(100),
          payableAmount: new Decimal(90),
          earnedPeriod: '2026-04',
        },
        '2026-05',
      ),
    ).toBe(true);
  });
});
