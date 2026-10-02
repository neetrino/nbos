import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  applyPayrollBonusCap,
  computeMonthlyBonusCap,
  resolveReattachIncludedAmount,
  resolveRememberedConsumedCarryFields,
} from './payroll-bonus-cap';

const ZERO = new Decimal(0);

describe('payroll bonus cap', () => {
  it('computes 200% of base salary cap', () => {
    expect(computeMonthlyBonusCap(new Decimal(100)).toString()).toBe('200');
  });

  it('includes the full amount when under the former two-salary room', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(50),
      currentBonusesTotal: new Decimal(100),
      baseSalary: new Decimal(100),
    });
    expect(result.payrollIncludedAmount.toString()).toBe('50');
    expect(result.payrollCarryOverAmount).toBeNull();
  });

  it('includes 300000 when it exceeds two salaries and creates no carry', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(300_000),
      currentBonusesTotal: ZERO,
      baseSalary: new Decimal(100_000),
      bonusCapBaseSalaryMultiplier: new Decimal(2),
    });
    expect(result.payrollIncludedAmount.toString()).toBe('300000');
    expect(result.payrollCarryOverAmount).toBeNull();
  });

  it('does not defer excess as salary-multiple carry-over', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(80),
      currentBonusesTotal: new Decimal(150),
      baseSalary: new Decimal(100),
    });
    expect(result.payrollIncludedAmount.toString()).toBe('80');
    expect(result.payrollCarryOverAmount).toBeNull();
  });

  it('includes the full amount when base salary is zero', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(80),
      currentBonusesTotal: new Decimal(500),
      baseSalary: ZERO,
    });
    expect(result.payrollIncludedAmount.toString()).toBe('80');
    expect(result.payrollCarryOverAmount).toBeNull();
  });

  it('re-attaches 200000 when later month consumed the 100000 carry', () => {
    const included = resolveReattachIncludedAmount({
      kpiScaledAmount: new Decimal(300_000),
      payrollCarryOverAmount: new Decimal(100_000),
      payrollCarryOverRemaining: null,
    });
    expect(included.toString()).toBe('200000');
  });

  it('re-attaches 300000 when none of the 100000 carry was consumed', () => {
    const included = resolveReattachIncludedAmount({
      kpiScaledAmount: new Decimal(300_000),
      payrollCarryOverAmount: new Decimal(100_000),
      payrollCarryOverRemaining: new Decimal(100_000),
    });
    expect(included.toString()).toBe('300000');
  });

  it('re-attaches 240000 when 40000 of the 100000 carry remains unpaid', () => {
    const included = resolveReattachIncludedAmount({
      kpiScaledAmount: new Decimal(300_000),
      payrollCarryOverAmount: new Decimal(100_000),
      payrollCarryOverRemaining: new Decimal(40_000),
    });
    expect(included.toString()).toBe('240000');
  });

  it('remembers 100000 consumed and 60000 consumed after re-attach', () => {
    expect(
      resolveRememberedConsumedCarryFields({
        payrollCarryOverAmount: new Decimal(100_000),
        payrollCarryOverRemaining: null,
      }).payrollCarryOverAmount?.toString(),
    ).toBe('100000');
    expect(
      resolveRememberedConsumedCarryFields({
        payrollCarryOverAmount: new Decimal(100_000),
        payrollCarryOverRemaining: new Decimal(40_000),
      }).payrollCarryOverAmount?.toString(),
    ).toBe('60000');
    expect(
      resolveRememberedConsumedCarryFields({
        payrollCarryOverAmount: new Decimal(100_000),
        payrollCarryOverRemaining: new Decimal(100_000),
      }).payrollCarryOverAmount,
    ).toBeNull();
  });
});
