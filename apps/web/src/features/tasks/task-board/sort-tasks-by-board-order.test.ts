import { describe, it, expect } from 'vitest';
import type { Task } from '@/lib/api/tasks';
import { sortTasksByBoardOrder } from './sort-tasks-by-board-order';

function task(id: string, order: number, createdAt: string): Task {
  return {
    id,
    workspaceSortOrder: order,
    myPlanSortOrder: order,
    createdAt,
  } as Task;
}

describe('sortTasksByBoardOrder', () => {
  it('sorts by workspaceSortOrder ascending', () => {
    const sorted = sortTasksByBoardOrder(
      [task('b', 2, '2026-01-02'), task('a', 0, '2026-01-03'), task('c', 1, '2026-01-01')],
      'workspaceSortOrder',
    );
    expect(sorted.map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('falls back to createdAt when sort order ties', () => {
    const sorted = sortTasksByBoardOrder(
      [task('old', 0, '2026-01-01'), task('new', 0, '2026-06-01')],
      'myPlanSortOrder',
    );
    expect(sorted.map((item) => item.id)).toEqual(['new', 'old']);
  });
});
