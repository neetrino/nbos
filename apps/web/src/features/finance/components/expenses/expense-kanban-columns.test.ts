import { describe, expect, it } from 'vitest';
import type { Expense } from '../../../../lib/api/finance';
import {
  buildExpenseKanbanColumns,
  buildExpenseLifecycleKanbanColumns,
} from './expense-kanban-columns';

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
    productId: null,
    projectId: null,
    credentialId: null,
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

  it('keeps sibling active cards after one row is merged to Paid', () => {
    const columns = buildExpenseKanbanColumns([
      mockExpense({ id: 'stay', status: 'OVERDUE' }),
      mockExpense({ id: 'moved', status: 'PAID' }),
    ]);
    expect(columns.flatMap((column) => column.items.map((row) => row.id))).toEqual(['stay']);
  });
});

describe('buildExpenseLifecycleKanbanColumns', () => {
  it('keeps active lanes and terminal Paid / Cancelled, omits Backlog', () => {
    const columns = buildExpenseLifecycleKanbanColumns([
      mockExpense({ id: 'a', status: 'DUE_NOW' }),
      mockExpense({ id: 'b', status: 'PAID' }),
      mockExpense({ id: 'c', status: 'CANCELLED' }),
      mockExpense({ id: 'd', status: 'BACKLOG' }),
    ]);
    expect(columns.map((column) => column.key)).toEqual([
      'PLANNED',
      'DUE_SOON',
      'DUE_NOW',
      'OVERDUE',
      'ON_HOLD',
      'PAID',
      'CANCELLED',
    ]);
    expect(columns.find((column) => column.key === 'PAID')?.items.map((row) => row.id)).toEqual([
      'b',
    ]);
    expect(columns.flatMap((column) => column.items.map((row) => row.id))).not.toContain('d');
  });
});
