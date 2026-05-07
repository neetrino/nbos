import type { KanbanColumn } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';

/**
 * Canonical primary workflow columns for task boards driven by `task.status`
 * (global Tasks list Board view and Work Space Kanban). DEFERRED/CANCELLED stay
 * off this board — see `partitionWorkspaceSecondaryTasks`.
 */
export const WORKSPACE_KANBAN_COLUMN_DEFS = [
  { key: 'Open', label: 'Open', color: '#3B82F6', hexColor: '#3B82F6', sortOrder: 0 },
  { key: 'In Progress', label: 'In Progress', color: '#A855F7', hexColor: '#A855F7', sortOrder: 1 },
  { key: 'Review', label: 'Review', color: '#6366F1', hexColor: '#6366F1', sortOrder: 2 },
  { key: 'Completed', label: 'Completed', color: '#22C55E', hexColor: '#22C55E', sortOrder: 3 },
] as const;

export function isDeferredOrCancelledStatus(status: string): boolean {
  return status === 'DEFERRED' || status === 'CANCELLED';
}

export function taskBelongsInWorkspacePrimaryKanban(task: Task): boolean {
  return !isDeferredOrCancelledStatus(task.status);
}

/** Primary-board tasks only; DEFERRED/CANCELLED are shown in a secondary strip. */
export function buildWorkspaceKanbanColumns(tasks: Task[]): KanbanColumn<Task>[] {
  const primary = tasks.filter(taskBelongsInWorkspacePrimaryKanban);
  return WORKSPACE_KANBAN_COLUMN_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    color: def.color,
    hexColor: def.hexColor,
    items: primary.filter((t) => matchesWorkspaceColumn(t.status, def.key)),
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
    case 'Completed':
      return status === 'COMPLETED' || status === 'DONE';
    default:
      return false;
  }
}

export function partitionWorkspaceSecondaryTasks(tasks: Task[]): {
  deferred: Task[];
  cancelled: Task[];
} {
  return {
    deferred: tasks.filter((t) => t.status === 'DEFERRED'),
    cancelled: tasks.filter((t) => t.status === 'CANCELLED'),
  };
}
