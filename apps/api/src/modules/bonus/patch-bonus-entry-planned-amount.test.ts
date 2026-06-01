import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { resolvePlannedAmountFields } from './patch-bonus-entry-planned-amount';

describe('resolvePlannedAmountFields', () => {
  it('sets originalAmount from current when first edit', () => {
    const current = new Decimal('100');
    const next = new Decimal('120');
    const result = resolvePlannedAmountFields(current, next, null);
    expect(result.amount.toFixed(2)).toBe('120.00');
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });

  it('keeps existing originalAmount on subsequent edits', () => {
    const result = resolvePlannedAmountFields(
      new Decimal('120'),
      new Decimal('90'),
      new Decimal('100'),
    );
    expect(result.originalAmount.toFixed(2)).toBe('100.00');
  });
});
