import { describe, expect, it } from 'vitest';
import {
  payrollRunRemainingMajorUnits,
  payrollRunRemainingString2dp,
} from './payroll-run-remaining-from-strings';

describe('payrollRunRemainingFromStrings', () => {
  it('returns positive remaining', () => {
    expect(payrollRunRemainingString2dp('100.00', '40.00')).toBe('60.00');
    expect(payrollRunRemainingMajorUnits('100.00', '40.00')).toBe(60);
  });

  it('returns negative remaining when paid exceeds payable', () => {
    expect(payrollRunRemainingString2dp('10.00', '25.00')).toBe('-15.00');
  });

  it('treats non-finite inputs as zero', () => {
    expect(payrollRunRemainingString2dp('x', '10.00')).toBe('-10.00');
  });
});
