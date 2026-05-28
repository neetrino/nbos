import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { resolvePlannedAmountFields } from './payroll-matrix-planned-bonus';

describe('resolvePlannedAmountFields', () => {
  it('sets originalAmount from current when first edit', () => {
    const result = resolvePlannedAmountFields(new Decimal(100), new Decimal(120), null);
    expect(result.amount.toFixed(2)).toBe('120.00');
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });

  it('keeps existing originalAmount on subsequent edits', () => {
    const result = resolvePlannedAmountFields(new Decimal(120), new Decimal(150), new Decimal(100));
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });

  it('rejects zero or unchanged amounts', () => {
    expect(() => resolvePlannedAmountFields(new Decimal(50), new Decimal(0), null)).toThrow();
    expect(() => resolvePlannedAmountFields(new Decimal(50), new Decimal(50), null)).toThrow();
  });
});
