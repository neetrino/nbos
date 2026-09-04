import { describe, expect, it } from 'vitest';
import { coerceExpenseCategoryToCanonical } from './expense-category-canonical';

describe('coerceExpenseCategoryToCanonical', () => {
  it('maps legacy buckets onto survivors', () => {
    expect(coerceExpenseCategoryToCanonical('HOSTING')).toBe('DOMAIN');
    expect(coerceExpenseCategoryToCanonical('SERVICE')).toBe('TOOLS');
    expect(coerceExpenseCategoryToCanonical('INTERNAL_INFRA')).toBe('TOOLS');
    expect(coerceExpenseCategoryToCanonical('BANK_FEES')).toBe('TAXES');
    expect(coerceExpenseCategoryToCanonical('TRAINING')).toBe('OTHER');
  });

  it('keeps canonical values', () => {
    expect(coerceExpenseCategoryToCanonical('DOMAIN')).toBe('DOMAIN');
    expect(coerceExpenseCategoryToCanonical('TOOLS')).toBe('TOOLS');
    expect(coerceExpenseCategoryToCanonical('OTHER')).toBe('OTHER');
    expect(coerceExpenseCategoryToCanonical('PARTNER_PAYOUT')).toBe('PARTNER_PAYOUT');
  });

  it('returns null for unknown or payroll values', () => {
    expect(coerceExpenseCategoryToCanonical('SALARY')).toBeNull();
    expect(coerceExpenseCategoryToCanonical('NOPE')).toBeNull();
  });
});
