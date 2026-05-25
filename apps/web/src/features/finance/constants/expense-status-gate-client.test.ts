import { describe, expect, it } from 'vitest';
import { getLocalExpenseStatusGateErrors } from './expense-status-gate-client';
import type { Expense } from '@/lib/api/finance';

function expenseStub(overrides: Partial<Expense>): Expense {
  return {
    id: 'exp-1',
    name: 'Test',
    amount: '100',
    status: 'PLANNED',
    type: 'PLANNED',
    category: 'OTHER',
    frequency: 'ONE_TIME',
    dueDate: null,
    paidAmount: '40',
    remainingAmount: '60',
    ...overrides,
  } as Expense;
}

describe('getLocalExpenseStatusGateErrors', () => {
  it('blocks PAID when remaining balance is positive', () => {
    const errors = getLocalExpenseStatusGateErrors(expenseStub({}), 'PAID');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('payments');
  });

  it('allows PAID when fully covered', () => {
    const errors = getLocalExpenseStatusGateErrors(
      expenseStub({ paidAmount: '100', remainingAmount: '0' }),
      'PAID',
    );
    expect(errors).toHaveLength(0);
  });
});
