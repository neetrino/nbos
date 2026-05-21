import { describe, expect, it } from 'vitest';
import {
  buildExpensePlansKanbanColumns,
  resolveExpensePlanBoardColumn,
} from './expense-plans-board-columns';
import type { ExpensePlan } from '@/lib/api/expense-plans';

function plan(
  partial: Partial<ExpensePlan> & Pick<ExpensePlan, 'id' | 'name' | 'frequency'>,
): ExpensePlan {
  return {
    category: 'TOOLS',
    amount: '1000',
    nextDueDate: null,
    provider: null,
    projectId: null,
    autoGenerate: false,
    notes: null,
    createdAt: '',
    updatedAt: '',
    project: null,
    _count: { expenses: 0 },
    ...partial,
  };
}

describe('expense-plans-board-columns', () => {
  it('resolveExpensePlanBoardColumn maps known and unknown frequencies', () => {
    expect(resolveExpensePlanBoardColumn('MONTHLY')).toBe('MONTHLY');
    expect(resolveExpensePlanBoardColumn('CUSTOM')).toBe('OTHER');
  });

  it('buildExpensePlansKanbanColumns groups plans by frequency', () => {
    const columns = buildExpensePlansKanbanColumns([
      plan({ id: '1', name: 'Rent', frequency: 'MONTHLY' }),
      plan({ id: '2', name: 'Domain', frequency: 'YEARLY' }),
      plan({ id: '3', name: 'Ad hoc', frequency: 'CUSTOM' }),
    ]);
    const monthly = columns.find((c) => c.key === 'MONTHLY');
    const yearly = columns.find((c) => c.key === 'YEARLY');
    const other = columns.find((c) => c.key === 'OTHER');
    expect(monthly?.items).toHaveLength(1);
    expect(yearly?.items).toHaveLength(1);
    expect(other?.items).toHaveLength(1);
  });
});
