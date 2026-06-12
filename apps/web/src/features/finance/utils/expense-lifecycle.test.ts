import { describe, it, expect } from 'vitest';
import type { Expense } from '@/lib/api/finance';
import {
  canCancelExpense,
  canHardDeleteExpense,
  expenseLifecycleAction,
} from './expense-lifecycle';

function baseExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    type: 'PLANNED',
    category: 'HOSTING',
    name: 'Hosting',
    amount: '1000',
    frequency: 'ONE_TIME',
    dueDate: null,
    status: 'PLANNED',
    projectId: null,
    isPassThrough: false,
    taxStatus: 'TAX',
    backlogReason: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('expense-lifecycle', () => {
  it('allows hard delete for PLANNED without payments', () => {
    const expense = baseExpense();
    expect(canHardDeleteExpense(expense)).toBe(true);
    expect(expenseLifecycleAction(expense)).toBe('delete');
  });

  it('prefers cancel when payments exist', () => {
    const expense = baseExpense({
      payments: [
        {
          id: 'p1',
          amount: '100',
          paymentDate: '2026-01-02',
          notes: null,
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
    expect(canHardDeleteExpense(expense)).toBe(false);
    expect(canCancelExpense(expense)).toBe(true);
    expect(expenseLifecycleAction(expense)).toBe('cancel');
  });

  it('returns null for PAID expenses', () => {
    const expense = baseExpense({ status: 'PAID' });
    expect(expenseLifecycleAction(expense)).toBeNull();
  });
});
