import type { Task } from '@/lib/api/tasks';

/** Matches API `assertTaskDraftDeletable` — OPEN task with no links, checklists, or subtasks. */
export function canDeleteTaskDraft(task: Task): boolean {
  return (
    task.status === 'OPEN' &&
    task.links.length === 0 &&
    task._count.checklists === 0 &&
    task._count.subtasks === 0 &&
    task.completedAt == null
  );
}
