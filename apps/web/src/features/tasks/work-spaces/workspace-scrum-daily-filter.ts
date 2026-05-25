import type { Task } from '@/lib/api/tasks';
import type { TasksListBoardView } from '@/features/tasks/tasks-list-types';
import type { WorkspaceArea } from './workspace-area';

/** Planning states hidden from scrum Active area (backlog / future sprint). */
const SCRUM_PLANNING_EXCLUDED_FROM_DAILY = new Set(['BACKLOG', 'FUTURE_SPRINT']);

function isScrumActiveExecutionArea(options: {
  workspaceArea?: WorkspaceArea;
  boardView: TasksListBoardView;
}): boolean {
  if (options.workspaceArea === 'planning') return false;
  if (options.workspaceArea === 'active') return true;
  return options.boardView === 'kanban' || options.boardView === 'list';
}

/**
 * Scrum-enabled workspaces: Active area shows only active-sprint work (doc 02 §8.1).
 */
export function filterTasksForScrumDailyExecution(
  tasks: Task[],
  options: {
    scrumEnabled: boolean;
    boardView: TasksListBoardView;
    workspaceArea?: WorkspaceArea;
    activeSprintId?: string | null;
  },
): Task[] {
  if (!options.scrumEnabled) return tasks;
  if (!isScrumActiveExecutionArea(options)) return tasks;
  if (options.activeSprintId) {
    return tasks.filter((task) => task.sprintId === options.activeSprintId);
  }
  return tasks.filter((task) => task.planningStatus === 'ACTIVE_SPRINT');
}

export function isScrumPlanningExcludedFromDaily(planningStatus: string): boolean {
  return SCRUM_PLANNING_EXCLUDED_FROM_DAILY.has(planningStatus);
}
