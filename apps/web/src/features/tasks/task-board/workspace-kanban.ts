import type { KanbanColumn } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';

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
