import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';
import { BadRequestException } from '@nestjs/common';
import {
  assertSalesKpiInputsComplete,
  computePayrollIncludedBonusAmount,
  computeSalesKpiPayoutFactor,
  resolveSalesKpiPayoutFactorFromRun,
  resolveSalesKpiPayoutFactorOrHold,
} from './sales-kpi-payroll-payout';

describe('computeSalesKpiPayoutFactor', () => {
  it('returns 1 when plan is zero (treat as KPI off)', () => {
    expect(computeSalesKpiPayoutFactor(new Decimal(0), new Decimal(100)).toString()).toBe('1');
  });

  it('returns 1 at 70% attainment', () => {
    const f = computeSalesKpiPayoutFactor(new Decimal(1000), new Decimal(700));
    expect(f.toString()).toBe('1');
  });

  it('returns 0.5 between 50% and 70%', () => {
    const f = computeSalesKpiPayoutFactor(new Decimal(1000), new Decimal(600));
    expect(f.toString()).toBe('0.5');
  });

  it('returns 0 below 50%', () => {
    const f = computeSalesKpiPayoutFactor(new Decimal(1000), new Decimal(400));
    expect(f.toString()).toBe('0');
  });
});

describe('resolveSalesKpiPayoutFactorFromRun', () => {
  it('holds when KPI fields unset (does not pay factor 1 or 0)', () => {
    expect(
      resolveSalesKpiPayoutFactorFromRun({
        kpiSalesPlanAmount: null,
        kpiSalesActualAmount: null,
      }),
    ).toBeNull();
  });
});

describe('resolveSalesKpiPayoutFactorOrHold', () => {
  const examplePlan = new Decimal('1500000');

  it('pays factor 1 at exactly 70 percent of an individual plan', () => {
    expect(resolveSalesKpiPayoutFactorOrHold(examplePlan, new Decimal('1050000'))?.toString()).toBe(
      '1',
    );
  });

  it('pays factor 0.5 at exactly 50 percent of an individual plan', () => {
    expect(resolveSalesKpiPayoutFactorOrHold(examplePlan, new Decimal('750000'))?.toString()).toBe(
      '0.5',
    );
  });

  it('pays factor 0 just below 50 percent', () => {
    expect(
      resolveSalesKpiPayoutFactorOrHold(examplePlan, new Decimal('749999.99'))?.toString(),
    ).toBe('0');
  });

  it('holds when plan is missing', () => {
    expect(resolveSalesKpiPayoutFactorOrHold(null, new Decimal('1050000'))).toBeNull();
  });
});

describe('assertSalesKpiInputsComplete', () => {
  it('allows partial KPI when no SALES releases', () => {
    expect(() =>
      assertSalesKpiInputsComplete(
        { kpiSalesPlanAmount: new Decimal(1), kpiSalesActualAmount: null },
        false,
      ),
    ).not.toThrow();
  });

  it('throws when only plan is set for SALES batch', () => {
    expect(() =>
      assertSalesKpiInputsComplete(
        { kpiSalesPlanAmount: new Decimal(100), kpiSalesActualAmount: null },
        true,
      ),
    ).toThrow(BadRequestException);
  });
});

describe('computePayrollIncludedBonusAmount', () => {
  it('scales SALES by KPI factor', () => {
    const v = computePayrollIncludedBonusAmount({
      releaseAmount: new Decimal(100),
      bonusType: 'SALES',
      kpiFactor: new Decimal(0.5),
    });
    expect(v.toString()).toBe('50');
  });

  it('does not scale DELIVERY', () => {
    const v = computePayrollIncludedBonusAmount({
      releaseAmount: new Decimal(100),
      bonusType: 'DELIVERY',
      kpiFactor: new Decimal(0),
    });
    expect(v.toString()).toBe('100');
  });
});
