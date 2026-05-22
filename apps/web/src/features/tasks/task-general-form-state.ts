import type { Task } from '@/lib/api/tasks';
import { normalizeTaskStatusForDraft } from './utils/task-status-draft';

export interface TaskGeneralDraft {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string;
  creatorId: string;
  creatorLabel: string;
  assigneeId: string | null;
  assigneeLabel: string | null;
}

export function createTaskGeneralDraft(task: Task): TaskGeneralDraft {
  return {
    title: task.title,
    description: task.description,
    status: normalizeTaskStatusForDraft(task.status),
    priority: task.priority,
    dueDate: formatDueDateInput(task.dueDate),
    creatorId: task.creator.id,
    creatorLabel: `${task.creator.firstName} ${task.creator.lastName}`.trim(),
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
  if (draft.status !== snap.status) patch.status = draft.status;
  if (draft.priority !== snap.priority) patch.priority = draft.priority;
  if (draft.dueDate !== snap.dueDate) patch.dueDate = draft.dueDate || null;
  if (draft.creatorId !== snap.creatorId) patch.creatorId = draft.creatorId;
  if (draft.assigneeId !== snap.assigneeId) patch.assigneeId = draft.assigneeId;

  return patch;
}

export function isTaskGeneralDirty(a: TaskGeneralDraft, b: TaskGeneralDraft): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

/** `datetime-local` value for {@link NbosDatePicker} mode="datetime". */
function formatDueDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
