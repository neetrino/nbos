import type { KanbanColumn } from '@/components/shared';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { TASK_BOARD_STAGES } from '@/features/tasks/constants/task-board-lifecycle';
import type { Task } from '@/lib/api/tasks';
import { DEADLINE_COLUMNS_DEF, getDeadlineColumn } from './task-board-constants';

/**
 * Primary workflow columns for task boards driven by `task.status`
 * (global Tasks list Board view and Work Space Kanban).
 */
export const WORKSPACE_KANBAN_COLUMN_DEFS = [
  { key: 'Open', label: 'Open', color: '#2563EB', hexColor: '#2563EB', sortOrder: 0 },
  {
    key: 'In Progress',
    label: 'In Progress',
    color: '#F97316',
    hexColor: '#F97316',
    sortOrder: 1,
  },
  { key: 'Review', label: 'Review', color: '#7C3AED', hexColor: '#7C3AED', sortOrder: 2 },
  {
    key: 'On hold',
    label: 'On hold',
    color: '#18181B',
    hexColor: '#18181B',
    sortOrder: 3,
  },
  { key: 'Completed', label: 'Completed', color: '#16A34A', hexColor: '#16A34A', sortOrder: 4 },
] as const;

const KANBAN_COLUMN_BY_STAGE_KEY: Record<
  string,
  (typeof WORKSPACE_KANBAN_COLUMN_DEFS)[number]['key']
> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

export function buildWorkspaceKanbanColumns(
  tasks: Task[],
  scope: BoardLifecycleScope = 'ALL',
): KanbanColumn<Task>[] {
  const stageKeys = getBoardStageKeys(TASK_BOARD_STAGES, scope);
  const visibleColumnKeys = stageKeys
    .map((key) => KANBAN_COLUMN_BY_STAGE_KEY[key])
    .filter((key): key is (typeof WORKSPACE_KANBAN_COLUMN_DEFS)[number]['key'] => Boolean(key));

  return WORKSPACE_KANBAN_COLUMN_DEFS.filter((def) => visibleColumnKeys.includes(def.key)).map(
    (def) => ({
      key: def.key,
      label: def.label,
      color: def.color,
      hexColor: def.hexColor,
      items: tasks.filter((t) => matchesWorkspaceColumn(t.status, def.key)),
    }),
  );
}

export function buildDeadlineKanbanColumns(
  tasks: Task[],
  scope: BoardLifecycleScope = 'ALL',
): KanbanColumn<Task>[] {
  const defs =
    scope === 'CLOSED'
      ? DEADLINE_COLUMNS_DEF.filter((col) => col.key === 'done')
      : scope === 'ACTIVE'
        ? DEADLINE_COLUMNS_DEF.filter((col) => col.key !== 'done')
        : DEADLINE_COLUMNS_DEF;

  return defs.map((col) => ({
    key: col.key,
    label: col.label,
    color: col.color,
    hexColor: col.hexColor,
    items: tasks.filter((t) => getDeadlineColumn(t) === col.key),
  }));
}

function matchesWorkspaceColumn(status: string, columnKey: string): boolean {
  switch (columnKey) {
    case 'Open':
      return status === 'OPEN' || status === 'NEW';
    case 'In Progress':
      return status === 'IN_PROGRESS';
    case 'Review':
      return status === 'REVIEW';
    case 'On hold':
      return status === 'ON_HOLD';
    case 'Completed':
      return status === 'COMPLETED' || status === 'DONE';
    default:
      return false;
  }
}
