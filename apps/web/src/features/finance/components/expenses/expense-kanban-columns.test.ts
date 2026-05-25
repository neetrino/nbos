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

describe('buildExpenseKanbanColumns', () => {
  it('places DUE_NOW without due date in Due Now and omits PAID from NBOS board columns', () => {
    const columns = buildExpenseKanbanColumns([
      mockExpense({ id: 'a', status: 'DUE_NOW', dueDate: null }),
      mockExpense({ id: 'b', status: 'PAID' }),
    ]);
    const dueNow = columns.find((c) => c.key === 'DUE_NOW');
    expect(dueNow?.items.map((e) => e.id)).toContain('a');
    const allIds = columns.flatMap((c) => c.items.map((e) => e.id));
    expect(allIds).not.toContain('b');
  });
});
