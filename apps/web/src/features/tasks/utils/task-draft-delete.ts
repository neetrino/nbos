import type { Task } from '@/lib/api/tasks';

/** Matches API `isTaskDraftDeletable` — OPEN task with no links, checklists, or subtasks. */
export function canDeleteTaskDraft(task: Task): boolean {
  return (
    task.status === 'OPEN' &&
    task.links.length === 0 &&
    task._count.checklists === 0 &&
    task._count.subtasks === 0 &&
    task.completedAt == null &&
    task.reviewRequestedAt == null
  );
}

export function isTaskInTrash(task: Task): boolean {
  return task.trashedAt != null;
}

export function canMoveTaskToTrash(task: Task): boolean {
  return !isTaskInTrash(task) && !canDeleteTaskDraft(task);
}
