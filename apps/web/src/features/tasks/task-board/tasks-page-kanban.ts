import type { KanbanColumn } from '@/components/shared';
import type { Task, TaskBoardStage } from '@/lib/api/tasks';
import { KANBAN_STATUS_MAP } from './task-board-constants';

type KanbanStageSource = Pick<TaskBoardStage, 'id' | 'title' | 'color'>;

const FALLBACK_STAGES: KanbanStageSource[] = [
  { id: 'New', title: 'New', color: '#3B82F6' },
  { id: 'In Progress', title: 'In Progress', color: '#F59E0B' },
  { id: 'Done', title: 'Done', color: '#10B981' },
];

export function buildTasksPageKanbanColumns(
  tasks: Task[],
  kanbanStages: TaskBoardStage[],
): KanbanColumn<Task>[] {
  const stages: KanbanStageSource[] =
    kanbanStages.length > 0
      ? kanbanStages.map((s) => ({ id: s.id, title: s.title, color: s.color }))
      : FALLBACK_STAGES;

  return stages.map((stage) => {
    const stageStatus =
      KANBAN_STATUS_MAP[stage.title] ?? stage.title.toUpperCase().replace(/ /g, '_');
    return {
      key: stage.title,
      label: stage.title,
      color: stage.color,
      hexColor: stage.color,
      items: tasks.filter((t) => t.kanbanStageId === stage.id || t.status === stageStatus),
    };
  });
}
