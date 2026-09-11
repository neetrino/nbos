import { describe, expect, it } from 'vitest';
import {
  FINANCE_CALENDAR_CELL_GREEN,
  FINANCE_CALENDAR_CELL_ORANGE,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import {
  subscriptionMonthCellStatusLabel,
  subscriptionMonthCellVisualClass,
} from './subscription-coverage-cell-visual';

describe('subscriptionMonthCellVisualClass', () => {
  it('maps paid and overdue kinds', () => {
    expect(subscriptionMonthCellVisualClass('PAID')).toBe(FINANCE_CALENDAR_CELL_GREEN);
    expect(subscriptionMonthCellVisualClass('OVERDUE_INVOICE')).toBe(FINANCE_CALENDAR_CELL_ORANGE);
  });
});

describe('subscriptionMonthCellStatusLabel', () => {
  it('returns a short label for known kinds and empty for NA', () => {
    expect(subscriptionMonthCellStatusLabel('FORECAST')).toBe('Forecast');
    expect(subscriptionMonthCellStatusLabel('NA')).toBe('');
  });
});
