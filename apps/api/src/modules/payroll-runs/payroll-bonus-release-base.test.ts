import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  isBonusEligibleForPayrollMonth,
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
          earnedPeriod: '2026-04',
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
          earnedPeriod: '2026-04',
        },
        '2026-05',
      ).toString(),
    ).toBe('50000');
  });

  it('returns zero for delivery entries from the wrong earned month', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'DELIVERY',
          amount: new Decimal(50_000),
          payableAmount: null,
          earnedPeriod: '2026-05',
        },
        '2026-05',
      ).isZero(),
    ).toBe(true);
  });
});

describe('isBonusEligibleForPayrollMonth', () => {
  it('matches payroll month minus one', () => {
    expect(
      isBonusEligibleForPayrollMonth({ type: 'DELIVERY', earnedPeriod: '2026-04' }, '2026-05'),
    ).toBe(true);
  });

  it('rejects entries without an earned month', () => {
    expect(
      isBonusEligibleForPayrollMonth({ type: 'DELIVERY', earnedPeriod: null }, '2026-05'),
    ).toBe(false);
  });
});

describe('isSalesBonusEligibleForPayrollMonth', () => {
  it('keeps the Sales-specific attach guard', () => {
    expect(
      isSalesBonusEligibleForPayrollMonth({ type: 'SALES', earnedPeriod: '2026-04' }, '2026-05'),
    ).toBe(true);
    expect(
      isSalesBonusEligibleForPayrollMonth({ type: 'DELIVERY', earnedPeriod: '2026-04' }, '2026-05'),
    ).toBe(false);
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

  it('shows non-Sales entries from the previous earned month', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'DELIVERY',
          amount: new Decimal(100),
          payableAmount: null,
          earnedPeriod: '2026-04',
        },
        '2026-05',
      ),
    ).toBe(true);
  });

  it('hides non-Sales entries outside the previous earned month', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'DELIVERY',
          amount: new Decimal(100),
          payableAmount: null,
          earnedPeriod: '2026-03',
        },
        '2026-05',
      ),
    ).toBe(false);
  });
});
