import { describe, expect, it } from 'vitest';
import {
  buildExpensePlanPeriodFilterConfig,
  EXPENSE_PLAN_PERIOD_FILTER_ALL,
  parseExpensePlanPeriodFilterValue,
  resolveExpensePlanPeriodApiParam,
} from './expense-plan-period-filter';

describe('expense-plan-period-filter', () => {
  it('defaults Period to All and lists Monthly before other cadences', () => {
    const config = buildExpensePlanPeriodFilterConfig();
    expect(config.defaultOptionValue).toBe(EXPENSE_PLAN_PERIOD_FILTER_ALL);
    expect(config.options.map((option) => option.value)).toEqual([
      'MONTHLY',
      'QUARTERLY',
      'YEARLY',
      'WEEKLY',
      'MULTI_YEAR',
      'ONE_TIME',
      'all',
    ]);
  });

  it('parses known frequencies and falls back to all', () => {
    expect(parseExpensePlanPeriodFilterValue(null)).toBe('all');
    expect(parseExpensePlanPeriodFilterValue('MONTHLY')).toBe('MONTHLY');
    expect(parseExpensePlanPeriodFilterValue('NOPE')).toBe('all');
  });

  it('omits frequency on the API when All is selected', () => {
    expect(resolveExpensePlanPeriodApiParam('all')).toBeUndefined();
    expect(resolveExpensePlanPeriodApiParam('YEARLY')).toBe('YEARLY');
    expect(resolveExpensePlanPeriodApiParam('NOPE')).toBeUndefined();
  });
});
