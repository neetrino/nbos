import { describe, it, expect } from 'vitest';
import {
  expensePlanFrequencyLabel,
  expensePlanGridProjectName,
  formatExpensePlanDueMonth,
  formatExpensePlanGridRowSubtitle,
  formatExpensePlanShortDate,
} from './expense-plan-display';

describe('expensePlanFrequencyLabel', () => {
  it('maps known frequencies', () => {
    expect(expensePlanFrequencyLabel('MONTHLY')).toBe('Monthly');
    expect(expensePlanFrequencyLabel('WEEKLY')).toBe('Weekly');
    expect(expensePlanFrequencyLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('formatExpensePlanShortDate', () => {
  it('returns dash for null', () => {
    expect(formatExpensePlanShortDate(null)).toBe('—');
  });
});

describe('expensePlanGridProjectName', () => {
  it('returns the name after the code separator', () => {
    expect(expensePlanGridProjectName('BX-P-f36ec3ccb09b — 10xmarket.am')).toBe('10xmarket.am');
  });

  it('returns the full label when there is no separator', () => {
    expect(expensePlanGridProjectName('10xmarket.am')).toBe('10xmarket.am');
  });

  it('returns null when the label is missing', () => {
    expect(expensePlanGridProjectName(null)).toBeNull();
  });
});

describe('formatExpensePlanDueMonth', () => {
  it('formats a mid-month UTC date as short month and year', () => {
    expect(formatExpensePlanDueMonth('2027-08-15T12:00:00.000Z')).toBe('Aug 2027');
  });

  it('returns null for missing or invalid dates', () => {
    expect(formatExpensePlanDueMonth(null)).toBeNull();
    expect(formatExpensePlanDueMonth('not-a-date')).toBeNull();
  });
});

describe('formatExpensePlanGridRowSubtitle', () => {
  it('leads with frequency and project name only (no code)', () => {
    const subtitle = formatExpensePlanGridRowSubtitle({
      frequency: 'YEARLY',
      projectLabel: 'BX-P-f36ec3ccb09b — 10xmarket.am',
    });
    expect(subtitle.text).toBe('Yearly · 10xmarket.am');
    expect(subtitle.title).toBe('Yearly · 10xmarket.am');
  });

  it('shows frequency only when no project is linked', () => {
    const subtitle = formatExpensePlanGridRowSubtitle({
      frequency: 'MONTHLY',
      projectLabel: null,
    });
    expect(subtitle.text).toBe('Monthly');
    expect(subtitle.title).toBe('Monthly');
  });

  it('appends due month after frequency for yearly plans', () => {
    const subtitle = formatExpensePlanGridRowSubtitle({
      frequency: 'YEARLY',
      projectLabel: 'BX-P-f36ec3ccb09b — 10xmarket.am',
      nextDueDate: '2027-08-15T12:00:00.000Z',
    });
    expect(subtitle.text).toBe('Yearly · Aug 2027 · 10xmarket.am');
  });

  it('does not append due month for monthly plans', () => {
    const subtitle = formatExpensePlanGridRowSubtitle({
      frequency: 'MONTHLY',
      projectLabel: null,
      nextDueDate: '2027-08-15T12:00:00.000Z',
    });
    expect(subtitle.text).toBe('Monthly');
  });
});
