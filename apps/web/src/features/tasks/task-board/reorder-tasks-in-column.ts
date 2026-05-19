import type { Task } from '@/lib/api/tasks';
import { reorderItemsInColumn } from '@/components/shared/kanban/kanban-reorder';

/** Reorder tasks that belong to one kanban column while preserving other tasks' positions. */
export function reorderTasksInColumn(
  tasks: Task[],
  taskId: string,
  toIndex: number,
  isInColumn: (task: Task) => boolean,
): Task[] {
  return reorderItemsInColumn(tasks, taskId, toIndex, isInColumn, (task) => task.id);
}
