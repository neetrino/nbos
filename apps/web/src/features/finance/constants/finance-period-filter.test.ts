import { describe, expect, it } from 'vitest';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_DEFAULT_LIST_PERIOD,
  parseFinancePeriodFilterValue,
} from './finance-period-filter';

describe('finance-period-filter', () => {
  it('defaults list period filter to all', () => {
    expect(buildFinancePeriodFilterConfig().defaultOptionValue).toBe('all');
    expect(FINANCE_DEFAULT_LIST_PERIOD).toBe('all');
  });

  it('falls back to all for unknown period values', () => {
    expect(parseFinancePeriodFilterValue('')).toBe('all');
    expect(parseFinancePeriodFilterValue('invalid')).toBe('all');
  });

  it('parses known period values', () => {
    expect(parseFinancePeriodFilterValue('month')).toBe('month');
    expect(parseFinancePeriodFilterValue('all')).toBe('all');
  });
});
