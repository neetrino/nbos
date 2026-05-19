import type { Task } from '@/lib/api/tasks';

export const DEADLINE_COLUMNS_DEF = [
  { key: 'overdue', label: 'Overdue', color: '#EF4444', hexColor: '#EF4444' },
  { key: 'today', label: 'Today', color: '#F59E0B', hexColor: '#F59E0B' },
  { key: 'this-week', label: 'This Week', color: '#3B82F6', hexColor: '#3B82F6' },
  { key: 'next-week', label: 'Next Week', color: '#8B5CF6', hexColor: '#8B5CF6' },
  { key: 'later', label: '2+ Weeks', color: '#6B7280', hexColor: '#6B7280' },
  { key: 'no-date', label: 'No Due Date', color: '#9CA3AF', hexColor: '#9CA3AF' },
  { key: 'done', label: 'Completed', color: '#10B981', hexColor: '#10B981' },
] as const;

/** Maps Kanban column titles (UI) to persisted task.status values. */
export const KANBAN_STATUS_MAP: Record<string, string> = {
  New: 'OPEN',
  Open: 'OPEN',
  'In Progress': 'IN_PROGRESS',
  Review: 'REVIEW',
  'On hold': 'ON_HOLD',
  Done: 'COMPLETED',
  Completed: 'COMPLETED',
};

export function taskMatchesKanbanStatusColumn(task: Task, columnKey: string): boolean {
  const targetStatus = KANBAN_STATUS_MAP[columnKey] ?? columnKey.toUpperCase().replace(/ /g, '_');
  const currentStatus = task.status === 'NEW' && targetStatus === 'OPEN' ? 'OPEN' : task.status;
  return currentStatus === targetStatus;
}

export function taskMatchesDeadlineColumn(task: Task, columnKey: string): boolean {
  return getDeadlineColumn(task) === columnKey;
}

export function taskMatchesMyPlanColumn(task: Task, columnKey: string): boolean {
  if (columnKey === '__unassigned') {
    return !task.myPlanStageId;
  }
  return task.myPlanStageId === columnKey;
}

export function getDeadlineColumn(task: Task): string {
  if (task.status === 'COMPLETED' || task.status === 'DONE') return 'done';
  if (!task.dueDate) return 'no-date';

  const now = new Date();
  const due = new Date(task.dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'this-week';
  if (diffDays <= 14) return 'next-week';
  return 'later';
}

/** Due date preset when quick-creating from a Deadline column. */
export function getDueDateForDeadlineColumn(columnKey: string): string | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (columnKey) {
    case 'overdue': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }
    case 'today':
      return today.toISOString();
    case 'this-week': {
      const d = new Date(today);
      d.setDate(d.getDate() + 3);
      return d.toISOString();
    }
    case 'next-week': {
      const d = new Date(today);
      d.setDate(d.getDate() + 8);
      return d.toISOString();
    }
    case 'later': {
      const d = new Date(today);
      d.setDate(d.getDate() + 15);
      return d.toISOString();
    }
    case 'no-date':
      return null;
    default:
      return null;
  }
}
