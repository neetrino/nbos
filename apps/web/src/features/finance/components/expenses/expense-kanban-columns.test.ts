import { describe, expect, it } from 'vitest';
import type { Expense } from '../../../../lib/api/finance';
import { buildExpenseKanbanColumns } from './expense-kanban-columns';

function mockExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    type: 'PLANNED',
    category: 'OTHER',
    name: 'Test',
    amount: '100.00',
    frequency: 'ONE_TIME',
    dueDate: null,
    status: 'THIS_MONTH',
    projectId: null,
    isPassThrough: false,
    taxStatus: 'TAX',
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildExpenseKanbanColumns', () => {
  it('places UNPAID expenses in the Unpaid column', () => {
    const columns = buildExpenseKanbanColumns([
      mockExpense({ id: 'a', status: 'UNPAID' }),
      mockExpense({ id: 'b', status: 'PAID' }),
    ]);
    const unpaidCol = columns.find((c) => c.key === 'UNPAID');
    expect(unpaidCol?.items.map((e) => e.id)).toEqual(['a']);
    expect(columns.find((c) => c.key === 'PAID')?.items.map((e) => e.id)).toEqual(['b']);
  });
});
