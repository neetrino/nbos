import type { KanbanColumn } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';

/**
 * Primary workflow columns for task boards driven by `task.status`
 * (global Tasks list Board view and Work Space Kanban).
 */
export const WORKSPACE_KANBAN_COLUMN_DEFS = [
  { key: 'Open', label: 'Open', color: '#3B82F6', hexColor: '#3B82F6', sortOrder: 0 },
  { key: 'In Progress', label: 'In Progress', color: '#A855F7', hexColor: '#A855F7', sortOrder: 1 },
  { key: 'Review', label: 'Review', color: '#6366F1', hexColor: '#6366F1', sortOrder: 2 },
  {
    key: 'On hold',
    label: 'On hold',
    color: '#F59E0B',
    hexColor: '#F59E0B',
    sortOrder: 3,
  },
  { key: 'Completed', label: 'Completed', color: '#22C55E', hexColor: '#22C55E', sortOrder: 4 },
] as const;

export function buildWorkspaceKanbanColumns(tasks: Task[]): KanbanColumn<Task>[] {
  return WORKSPACE_KANBAN_COLUMN_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    color: def.color,
    hexColor: def.hexColor,
    items: tasks.filter((t) => matchesWorkspaceColumn(t.status, def.key)),
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
