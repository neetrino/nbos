import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertEmployeeTakeHomeCurrency,
  EMPLOYEE_TAKE_HOME_CURRENCY,
  isEmployeeTakeHomeCurrency,
  resolveCreateCompensationProfileCurrency,
  resolvePatchCompensationProfileCurrency,
} from './compensation-profile-currency';

describe('employee take-home currency', () => {
  it('accepts AMD only', () => {
    expect(isEmployeeTakeHomeCurrency('AMD')).toBe(true);
    expect(EMPLOYEE_TAKE_HOME_CURRENCY).toBe('AMD');
    expect(resolveCreateCompensationProfileCurrency(undefined)).toBe('AMD');
    expect(resolveCreateCompensationProfileCurrency('AMD')).toBe('AMD');
    expect(resolvePatchCompensationProfileCurrency(undefined)).toBeUndefined();
    expect(resolvePatchCompensationProfileCurrency('AMD')).toBe('AMD');
    expect(() => assertEmployeeTakeHomeCurrency('AMD')).not.toThrow();
  });

  it('rejects USD, EUR, blank, and mixed values without rewriting them to AMD', () => {
    for (const currency of ['USD', 'EUR', '', '  ', 'AMD/USD', 'usd']) {
      expect(isEmployeeTakeHomeCurrency(currency)).toBe(false);
      expect(() => assertEmployeeTakeHomeCurrency(currency)).toThrow(BadRequestException);
      expect(() => resolveCreateCompensationProfileCurrency(currency)).toThrow(BadRequestException);
      expect(() => resolvePatchCompensationProfileCurrency(currency)).toThrow(BadRequestException);
    }
  });
});
