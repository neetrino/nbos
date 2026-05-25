import { tasksApi, type Task } from '@/lib/api/tasks';
type TaskQuickCreateBoardView = 'kanban' | 'deadline' | 'my-plan' | 'list' | 'planning';
import { KANBAN_STATUS_MAP } from './task-board-constants';

/**
 * After quick-create, place the task in the kanban column where "+" was clicked.
 */
export async function applyTaskToKanbanColumn(
  task: Task,
  columnKey: string,
  boardView: TaskQuickCreateBoardView,
): Promise<Task> {
  if (boardView === 'my-plan') {
    if (columnKey === '__unassigned') return task;
    return tasksApi.update(task.id, { myPlanStageId: columnKey });
  }

  if (boardView === 'deadline') {
    return task;
  }

  const targetStatus = KANBAN_STATUS_MAP[columnKey] ?? columnKey.toUpperCase().replace(/ /g, '_');
  const normalizedCurrent = task.status === 'NEW' && targetStatus === 'OPEN' ? 'OPEN' : task.status;
  if (normalizedCurrent === targetStatus) return task;

  if (
    targetStatus === 'IN_PROGRESS' &&
    (task.status === 'OPEN' || task.status === 'NEW' || task.status === 'ON_HOLD')
  ) {
    return tasksApi.start(task.id);
  }
  if (targetStatus === 'COMPLETED' || targetStatus === 'DONE') {
    return tasksApi.complete(task.id);
  }
  if (targetStatus === 'OPEN' && task.status !== 'OPEN' && task.status !== 'NEW') {
    return tasksApi.reopen(task.id);
  }
  return tasksApi.update(task.id, { status: targetStatus });
}
