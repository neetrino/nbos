import type { Task } from '@/lib/api/tasks';
import { pickEmployeeLabels, resolveEmployeeLabelMap } from './task-employee-labels';
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
  coAssigneeIds: string[];
  coAssigneeLabels: Record<string, string>;
  observerIds: string[];
  observerLabels: Record<string, string>;
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
    coAssigneeIds: [...task.coAssignees],
    coAssigneeLabels: {},
    observerIds: [...task.observers],
    observerLabels: {},
  };
}

/** Loads participant display names for multi-select pickers. */
export async function enrichTaskGeneralDraft(task: Task): Promise<TaskGeneralDraft> {
  const base = createTaskGeneralDraft(task);
  const participantIds = [...task.coAssignees, ...task.observers];
  if (participantIds.length === 0) return base;

  const labelMap = await resolveEmployeeLabelMap(participantIds);
  return {
    ...base,
    coAssigneeLabels: pickEmployeeLabels(base.coAssigneeIds, labelMap),
    observerLabels: pickEmployeeLabels(base.observerIds, labelMap),
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
  if (!sameIdList(draft.coAssigneeIds, snap.coAssigneeIds)) {
    patch.coAssignees = draft.coAssigneeIds;
  }
  if (!sameIdList(draft.observerIds, snap.observerIds)) {
    patch.observers = draft.observerIds;
  }

  return patch;
}

function sameIdList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
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
