import type { Task } from '@/lib/api/tasks';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';

/** Planning states hidden from scrum daily execution views (kanban/list). */
const SCRUM_PLANNING_EXCLUDED_FROM_DAILY = new Set(['BACKLOG', 'FUTURE_SPRINT']);

/**
 * Scrum-enabled workspaces: daily board/list show only active-sprint work (doc 02 §8.1).
 */
export function filterTasksForScrumDailyExecution(
  tasks: Task[],
  options: {
    scrumEnabled: boolean;
    boardView: TasksListBoardView;
    activeSprintId?: string | null;
  },
): Task[] {
  if (!options.scrumEnabled) return tasks;
  if (options.boardView !== 'kanban' && options.boardView !== 'list') return tasks;
  if (options.activeSprintId) {
    return tasks.filter((task) => task.sprintId === options.activeSprintId);
  }
  return tasks.filter((task) => task.planningStatus === 'ACTIVE_SPRINT');
}

export function isScrumPlanningExcludedFromDaily(planningStatus: string): boolean {
  return SCRUM_PLANNING_EXCLUDED_FROM_DAILY.has(planningStatus);
}
