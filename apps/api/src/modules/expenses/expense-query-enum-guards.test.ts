import { describe, expect, it } from 'vitest';
import {
  pickExpenseCategoryFilter,
  pickExpenseFrequencyFilter,
  pickExpenseStatusFilter,
  pickExpenseTypeFilter,
} from './expense-query-enum-guards';

describe('expense-query-enum-guards', () => {
  it('accepts known enum members', () => {
    expect(pickExpenseTypeFilter('PLANNED')).toBe('PLANNED');
    expect(pickExpenseCategoryFilter('HOSTING')).toBe('HOSTING');
    expect(pickExpenseFrequencyFilter('MONTHLY')).toBe('MONTHLY');
    expect(pickExpenseStatusFilter('DELAYED')).toBe('DELAYED');
  });

  it('returns undefined for unknown or empty values', () => {
    expect(pickExpenseTypeFilter('NOT_VALID')).toBeUndefined();
    expect(pickExpenseStatusFilter('OLD')).toBeUndefined();
    expect(pickExpenseCategoryFilter('')).toBeUndefined();
    expect(pickExpenseFrequencyFilter(undefined)).toBeUndefined();
  });
});
