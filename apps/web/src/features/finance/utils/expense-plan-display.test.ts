import { describe, it, expect } from 'vitest';
import { expensePlanFrequencyLabel, formatExpensePlanShortDate } from './expense-plan-display';

describe('expensePlanFrequencyLabel', () => {
  it('maps known frequencies', () => {
    expect(expensePlanFrequencyLabel('MONTHLY')).toBe('Monthly');
    expect(expensePlanFrequencyLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('formatExpensePlanShortDate', () => {
  it('returns dash for null', () => {
    expect(formatExpensePlanShortDate(null)).toBe('—');
  });
});
