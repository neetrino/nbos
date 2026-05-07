import type { Task } from '@/lib/api/tasks';

/**
 * Client-side filter for workspace boards (full task list stays in parent state for mutations).
 */
export function filterTasksForWorkspaceView(
  tasks: Task[],
  search: string,
  filterValues: Record<string, string>,
): Task[] {
  const q = search.trim().toLowerCase();
  const status = filterValues.status;
  const priority = filterValues.priority;

  return tasks.filter((t) => {
    if (q) {
      const assignee = t.assignee != null ? `${t.assignee.firstName} ${t.assignee.lastName}` : '';
      const blob = [t.title, t.code, t.description ?? '', assignee].join(' ').toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (status && status !== 'all' && t.status !== status) return false;
    if (priority && priority !== 'all' && t.priority !== priority) return false;
    return true;
  });
}
