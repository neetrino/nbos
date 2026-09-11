import { describe, expect, it } from 'vitest';
import {
  EXPENSE_CARD_NO_DUE_DATE_LABEL,
  formatExpenseCardDueDate,
} from './expense-kanban-card-due';

const NOW = new Date('2026-09-04T12:00:00.000Z');

describe('formatExpenseCardDueDate', () => {
  it('returns the empty label without a due date', () => {
    expect(formatExpenseCardDueDate(null, NOW)).toBe(EXPENSE_CARD_NO_DUE_DATE_LABEL);
    expect(formatExpenseCardDueDate(undefined, NOW)).toBe(EXPENSE_CARD_NO_DUE_DATE_LABEL);
    expect(formatExpenseCardDueDate('not-a-date', NOW)).toBe(EXPENSE_CARD_NO_DUE_DATE_LABEL);
  });

  it('shows month and day for the current year', () => {
    expect(formatExpenseCardDueDate('2026-04-10T12:00:00.000Z', NOW)).toBe('Apr 10');
  });

  it('adds the year when the due date is in another year', () => {
    expect(formatExpenseCardDueDate('2025-12-01T12:00:00.000Z', NOW)).toBe('Dec 1, 2025');
  });
});
