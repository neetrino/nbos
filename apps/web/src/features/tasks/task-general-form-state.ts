import type { Task } from '@/lib/api/tasks';

export interface TaskGeneralDraft {
  title: string;
  description: string | null;
  priority: string;
  startDate: string;
  dueDate: string;
  assigneeId: string | null;
  assigneeLabel: string | null;
}

export function createTaskGeneralDraft(task: Task): TaskGeneralDraft {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    startDate: formatDateInput(task.startDate),
    dueDate: formatDateInput(task.dueDate),
    assigneeId: task.assignee?.id ?? null,
    assigneeLabel: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : null,
  };
}

export function buildTaskGeneralPatch(
  snap: TaskGeneralDraft,
  draft: TaskGeneralDraft,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (draft.title.trim() !== snap.title.trim()) patch.title = draft.title.trim();
  if ((draft.description ?? '') !== (snap.description ?? '')) {
    patch.description = draft.description?.trim() ? draft.description.trim() : null;
  }
  if (draft.priority !== snap.priority) patch.priority = draft.priority;
  if (draft.startDate !== snap.startDate) patch.startDate = draft.startDate || null;
  if (draft.dueDate !== snap.dueDate) patch.dueDate = draft.dueDate || null;
  if (draft.assigneeId !== snap.assigneeId) patch.assigneeId = draft.assigneeId;

  return patch;
}

export function isTaskGeneralDirty(a: TaskGeneralDraft, b: TaskGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function formatDateInput(value: string | null): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}
