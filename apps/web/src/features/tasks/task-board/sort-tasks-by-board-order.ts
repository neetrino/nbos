import type { Task } from '@/lib/api/tasks';

export type TaskBoardSortField = 'workspaceSortOrder' | 'myPlanSortOrder';

export function sortFieldForReorderScope(scope: 'workspace' | 'my-plan'): TaskBoardSortField {
  return scope === 'workspace' ? 'workspaceSortOrder' : 'myPlanSortOrder';
}

/** Stable ascending sort for board columns; falls back to newest-first by createdAt. */
export function sortTasksByBoardOrder(tasks: Task[], field: TaskBoardSortField): Task[] {
  return [...tasks].sort((left, right) => {
    const orderDiff = left[field] - right[field];
    if (orderDiff !== 0) return orderDiff;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

/** Write 0..n-1 onto the column's sort field so board rebuild keeps the new order. */
export function applySequentialBoardSortOrder(
  tasks: Task[],
  isInColumn: (task: Task) => boolean,
  field: TaskBoardSortField,
): Task[] {
  let index = 0;
  return tasks.map((task) => (isInColumn(task) ? { ...task, [field]: index++ } : task));
}
