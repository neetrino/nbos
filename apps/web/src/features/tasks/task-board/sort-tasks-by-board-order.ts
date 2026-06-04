import type { Task } from '@/lib/api/tasks';

export type TaskBoardSortField = 'workspaceSortOrder' | 'myPlanSortOrder';

/** Stable ascending sort for board columns; falls back to newest-first by createdAt. */
export function sortTasksByBoardOrder(tasks: Task[], field: TaskBoardSortField): Task[] {
  return [...tasks].sort((left, right) => {
    const orderDiff = left[field] - right[field];
    if (orderDiff !== 0) return orderDiff;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
