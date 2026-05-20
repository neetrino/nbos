import { describe, expect, it } from 'vitest';
import { foldExpenseCards } from './finance-card-metrics';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('foldExpenseCards', () => {
  it('buckets DUE_NOW workflow status separately from date-based due soon', () => {
    const result = foldExpenseCards([
      {
        amount: 100,
        dueDate: daysFromToday(3),
        status: 'DUE_NOW',
        backlogReason: null,
        expensePayments: [],
      },
    ]);

    expect(result.dueNow).toEqual({ count: 1, amount: 100 });
    expect(result.dueSoon).toEqual({ count: 0, amount: 0 });
  });

  it('maps OVERDUE status and past due dates to overdue bucket', () => {
    const result = foldExpenseCards([
      {
        amount: 50,
        dueDate: daysFromToday(-2),
        status: 'PLANNED',
        backlogReason: null,
        expensePayments: [],
      },
      {
        amount: 75,
        dueDate: null,
        status: 'OVERDUE',
        backlogReason: null,
        expensePayments: [],
      },
    ]);

    expect(result.overdue).toEqual({ count: 2, amount: 125 });
  });
});

function daysFromToday(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return new Date(date.getTime() + days * ONE_DAY_MS);
}
