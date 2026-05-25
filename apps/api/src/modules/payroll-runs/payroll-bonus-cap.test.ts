import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { applyPayrollBonusCap, computeMonthlyBonusCap } from './payroll-bonus-cap';

const ZERO = new Decimal(0);

describe('payroll bonus cap', () => {
  it('computes 200% of base salary cap', () => {
    expect(computeMonthlyBonusCap(new Decimal(100)).toString()).toBe('200');
  });

  it('passes through when under cap room', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(50),
      currentBonusesTotal: new Decimal(100),
      baseSalary: new Decimal(100),
    });
    expect(result.payrollIncludedAmount.toString()).toBe('50');
    expect(result.payrollCarryOverAmount).toBeNull();
  });

  it('defers excess as carry-over', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(80),
      currentBonusesTotal: new Decimal(150),
      baseSalary: new Decimal(100),
    });
    expect(result.payrollIncludedAmount.toString()).toBe('50');
    expect(result.payrollCarryOverAmount?.toString()).toBe('30');
  });

  it('skips cap when base salary is zero', () => {
    const result = applyPayrollBonusCap({
      kpiScaledAmount: new Decimal(80),
      currentBonusesTotal: new Decimal(500),
      baseSalary: ZERO,
    });
    expect(result.payrollIncludedAmount.toString()).toBe('80');
    expect(result.payrollCarryOverAmount).toBeNull();
  });
});
