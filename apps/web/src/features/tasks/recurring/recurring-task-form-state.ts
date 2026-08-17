import type {
  RecurringFrequency,
  RecurringTaskTemplate,
  RecurringTaskWritePayload,
} from '@/lib/api/recurring-tasks';
import { formatEmployeeDisplayName } from '@/features/tasks/task-employee-labels';
import { isTaskUrgentPriority } from '@/features/tasks/constants/tasks';
import { RECURRING_CHECKLIST_TITLE, RECURRING_DEFAULT_TIME } from './recurring-task-constants';

export type RecurringPriority = 'NORMAL' | 'HIGH';

export interface RecurringTaskFormDraft {
  title: string;
  description: string;
  assigneeId: string | null;
  assigneeLabel: string | null;
  assigneeAvatar: string | null;
  priority: RecurringPriority;
  frequency: RecurringFrequency;
  interval: string;
  daysOfWeek: string[];
  dayOfMonth: string;
  startDate: string;
  timeOfDay: string;
  endDate: string;
  dueDateOffset: string;
  checklistItems: string[];
  isActive: boolean;
}

export function createEmptyRecurringDraft(now = new Date()): RecurringTaskFormDraft {
  return {
    title: '',
    description: '',
    assigneeId: null,
    assigneeLabel: null,
    assigneeAvatar: null,
    priority: 'NORMAL',
    frequency: 'WEEKLY',
    interval: '1',
    daysOfWeek: [],
    dayOfMonth: '',
    startDate: toDateInput(now),
    timeOfDay: RECURRING_DEFAULT_TIME,
    endDate: '',
    dueDateOffset: '',
    checklistItems: [],
    isActive: true,
  };
}

export function createRecurringDraftFromTemplate(
  template: RecurringTaskTemplate,
): RecurringTaskFormDraft {
  const start = new Date(template.startDate);
  return {
    title: template.title,
    description: template.description ?? '',
    assigneeId: template.assignee?.id ?? null,
    assigneeLabel: template.assignee
      ? formatEmployeeDisplayName(template.assignee.firstName, template.assignee.lastName)
      : null,
    assigneeAvatar: template.assignee?.avatar ?? null,
    priority: isTaskUrgentPriority(template.priority) ? 'HIGH' : 'NORMAL',
    frequency: normalizeFrequency(template.frequency),
    interval: String(template.interval),
    daysOfWeek: [...template.daysOfWeek],
    dayOfMonth: template.dayOfMonth ? String(template.dayOfMonth) : '',
    startDate: Number.isNaN(start.getTime()) ? '' : toDateInput(start),
    timeOfDay: Number.isNaN(start.getTime()) ? RECURRING_DEFAULT_TIME : toTimeInput(start),
    endDate: template.endDate ? toDateInput(new Date(template.endDate)) : '',
    dueDateOffset: template.dueDateOffset != null ? String(template.dueDateOffset) : '',
    checklistItems: parseChecklistItems(template.checklistData),
    isActive: template.isActive,
  };
}

export function isRecurringDraftDirty(
  draft: RecurringTaskFormDraft,
  snap: RecurringTaskFormDraft,
): boolean {
  return JSON.stringify(normalizeDraft(draft)) !== JSON.stringify(normalizeDraft(snap));
}

export function recurringDraftToPayload(
  draft: RecurringTaskFormDraft,
): Omit<RecurringTaskWritePayload, 'creatorId'> {
  const interval = Number.parseInt(draft.interval, 10);
  const dayOfMonth = draft.frequency === 'MONTHLY' ? parseOptionalInt(draft.dayOfMonth) : null;
  const dueDateOffset = parseOptionalInt(draft.dueDateOffset);
  const items = draft.checklistItems.map((item) => item.trim()).filter(Boolean);

  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    assigneeId: draft.assigneeId,
    priority: draft.priority,
    frequency: draft.frequency,
    interval: Number.isInteger(interval) && interval >= 1 ? interval : 1,
    daysOfWeek: draft.frequency === 'WEEKLY' ? draft.daysOfWeek : [],
    dayOfMonth,
    startDate: combineDateAndTime(draft.startDate, draft.timeOfDay),
    endDate: draft.endDate ? combineDateAndTime(draft.endDate, draft.timeOfDay) : null,
    dueDateOffset,
    isActive: draft.isActive,
    checklistData: items.length > 0 ? { title: RECURRING_CHECKLIST_TITLE, items } : null,
  };
}

function normalizeFrequency(value: string): RecurringFrequency {
  if (value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY') {
    return value;
  }
  return 'WEEKLY';
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function combineDateAndTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function parseOptionalInt(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseChecklistItems(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === 'string' ? item : ''))
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDraft(draft: RecurringTaskFormDraft): RecurringTaskFormDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    daysOfWeek: [...draft.daysOfWeek].sort(),
    checklistItems: draft.checklistItems.map((item) => item.trim()).filter(Boolean),
  };
}
