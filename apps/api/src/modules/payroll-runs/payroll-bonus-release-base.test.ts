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

  it('uses full amount for SALES without KPI policy', () => {
    expect(
      payrollBonusReleaseBase(
        {
          type: 'SALES',
          amount: new Decimal(100_000),
          payableAmount: null,
          earnedPeriod: '2026-04',
          hasKpiPolicy: false,
        },
        '2026-05',
      ).toString(),
    ).toBe('100000');
  });

  it('uses amount for delivery entries', () => {
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
  it('hides SALES with KPI policy until payable snapshot exists', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'SALES',
          amount: new Decimal(100),
          payableAmount: null,
          earnedPeriod: '2026-04',
          hasKpiPolicy: true,
        },
        '2026-05',
      ),
    ).toBe(false);
  });

  it('shows SALES without KPI policy even when payable snapshot is missing', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'SALES',
          amount: new Decimal(100),
          payableAmount: null,
          earnedPeriod: '2026-04',
          hasKpiPolicy: false,
        },
        '2026-05',
      ),
    ).toBe(true);
  });
});
