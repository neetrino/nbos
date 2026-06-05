import type { Dispatch, SetStateAction } from 'react';
import type { Task } from '@/lib/api/tasks';
import { tasksApi } from '@/lib/api/tasks';
import { reorderTasksInColumn } from './reorder-tasks-in-column';

export type TaskBoardReorderScope = 'workspace' | 'my-plan';

type PersistColumnTaskReorderArgs = {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  taskId: string;
  toIndex: number;
  isInColumn: (task: Task) => boolean;
  scope: TaskBoardReorderScope;
};

/** Optimistic column reorder with server persistence; rolls back on failure. */
export function persistColumnTaskReorder({
  tasks,
  setTasks,
  taskId,
  toIndex,
  isInColumn,
  scope,
}: PersistColumnTaskReorderArgs): void {
  const previousTasks = tasks;
  const nextTasks = reorderTasksInColumn(previousTasks, taskId, toIndex, isInColumn);
  setTasks(nextTasks);

  const columnTaskIds = nextTasks.filter(isInColumn).map((task) => task.id);
  void tasksApi.reorder(columnTaskIds, scope).catch(() => {
    setTasks(previousTasks);
  });
}
