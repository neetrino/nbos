import type { KanbanColumn } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';

export const WORKSPACE_PLANNING_COLUMN_DEFS = [
  { key: 'BACKLOG', label: 'Backlog', color: '#64748B', hexColor: '#64748B' },
  { key: 'FUTURE_SPRINT', label: 'Future sprint', color: '#8B5CF6', hexColor: '#8B5CF6' },
  { key: 'UNPLANNED', label: 'Unplanned', color: '#94A3B8', hexColor: '#94A3B8' },
  { key: 'ACTIVE_SPRINT', label: 'Active sprint', color: '#2563EB', hexColor: '#2563EB' },
] as const;

export type WorkspacePlanningColumnKey = (typeof WORKSPACE_PLANNING_COLUMN_DEFS)[number]['key'];

export function buildWorkspacePlanningColumns(tasks: Task[]): KanbanColumn<Task>[] {
  return WORKSPACE_PLANNING_COLUMN_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    color: def.color,
    hexColor: def.hexColor,
    items: tasks.filter((t) => t.planningStatus === def.key),
  }));
}

export function resolvePlanningColumnKey(columnKey: string): WorkspacePlanningColumnKey {
  const allowed = WORKSPACE_PLANNING_COLUMN_DEFS.map((c) => c.key);
  if (allowed.includes(columnKey as WorkspacePlanningColumnKey)) {
    return columnKey as WorkspacePlanningColumnKey;
  }
  return 'UNPLANNED';
}
