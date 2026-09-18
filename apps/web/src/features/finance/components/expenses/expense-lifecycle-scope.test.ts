import { describe, expect, it } from 'vitest';
import { expenseKanbanScopeFromBoardScope } from './expense-lifecycle-scope';

describe('expenseKanbanScopeFromBoardScope', () => {
  it('maps lifecycle scope to kanban columns', () => {
    expect(expenseKanbanScopeFromBoardScope('ACTIVE')).toBe('active');
    expect(expenseKanbanScopeFromBoardScope('CLOSED')).toBe('closed');
    expect(expenseKanbanScopeFromBoardScope('ALL')).toBe('all');
  });
});
