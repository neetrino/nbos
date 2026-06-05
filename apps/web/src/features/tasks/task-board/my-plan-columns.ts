import type { KanbanColumn } from '@/components/shared';
import type { Task, TaskBoardStage } from '@/lib/api/tasks';
import { sortTasksByBoardOrder } from './sort-tasks-by-board-order';

export function buildMyPlanColumns(
  tasks: Task[],
  myPlanStages: TaskBoardStage[],
): KanbanColumn<Task>[] {
  if (myPlanStages.length === 0) {
    return [
      {
        key: '__unassigned',
        label: 'Unassigned',
        color: '#6B7280',
        hexColor: '#6B7280',
        items: tasks,
      },
    ];
  }

  const columns: KanbanColumn<Task>[] = myPlanStages.map((stage) => ({
    key: stage.id,
    label: stage.title,
    color: stage.color,
    hexColor: stage.color,
    items: sortTasksByBoardOrder(
      tasks.filter((task) => task.myPlanStageId === stage.id),
      'myPlanSortOrder',
    ),
  }));

  const assignedIds = new Set(myPlanStages.map((s) => s.id));
  const unassigned = tasks.filter((t) => !t.myPlanStageId || !assignedIds.has(t.myPlanStageId));
  if (unassigned.length > 0) {
    columns.unshift({
      key: '__unassigned',
      label: 'Unassigned',
      color: '#6B7280',
      hexColor: '#6B7280',
      items: unassigned,
      readonly: true,
    });
  }

  return columns;
}
