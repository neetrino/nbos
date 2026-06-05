import type { Task } from '@/lib/api/tasks';

/** Ensures list-row task has arrays required by the task sheet before detail hydration. */
export function taskDetailPlaceholderFromListItem(task: Task): Task {
  return {
    ...task,
    coAssignees: task.coAssignees ?? [],
    observers: task.observers ?? [],
    links: task.links ?? [],
    checklists: task.checklists ?? [],
    subtasks: task.subtasks ?? [],
    completionRules: task.completionRules ?? null,
  };
}
