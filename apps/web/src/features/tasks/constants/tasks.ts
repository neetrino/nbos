import type { StatusVariant } from '@/components/shared/StatusBadge';

export const TASK_STATUSES = [
  { value: 'OPEN', label: 'Open', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    variant: 'orange' as StatusVariant,
    color: 'bg-orange-500',
  },
  { value: 'REVIEW', label: 'Review', variant: 'violet' as StatusVariant, color: 'bg-violet-600' },
  {
    value: 'ON_HOLD',
    label: 'On hold',
    variant: 'zinc' as StatusVariant,
    color: 'bg-zinc-900',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    variant: 'green' as StatusVariant,
    color: 'bg-green-500',
  },
] as const;

/** Product model: normal vs urgent (stored as NORMAL / HIGH; legacy CRITICAL reads as urgent). */
export const TASK_PRIORITIES = [
  {
    value: 'NORMAL',
    label: 'Normal',
    variant: 'gray' as StatusVariant,
    color: 'text-muted-foreground',
  },
  { value: 'HIGH', label: 'Urgent', variant: 'orange' as StatusVariant, color: 'text-orange-500' },
] as const;

const TASK_URGENT_PRIORITIES = new Set<string>(['HIGH', 'CRITICAL']);

export function getTaskStatus(value: string) {
  return TASK_STATUSES.find((s) => s.value === value);
}

export function isTaskUrgentPriority(priority: string): boolean {
  return TASK_URGENT_PRIORITIES.has(priority);
}

/** @deprecated Prefer {@link isTaskUrgentPriority}. */
export function isTaskHighPriority(priority: string): boolean {
  return isTaskUrgentPriority(priority);
}

export function getTaskPriority(value: string) {
  const bucket = isTaskUrgentPriority(value) ? 'HIGH' : 'NORMAL';
  return TASK_PRIORITIES.find((p) => p.value === bucket);
}

/** Toggle between NORMAL and HIGH (urgent). */
export function toggleTaskUrgentPriority(priority: string): string {
  return isTaskUrgentPriority(priority) ? 'NORMAL' : 'HIGH';
}

/** @deprecated Prefer {@link toggleTaskUrgentPriority}. */
export function toggleTaskHighPriority(priority: string): string {
  return toggleTaskUrgentPriority(priority);
}

export function taskMatchesPriorityFilter(taskPriority: string, filterValue: string): boolean {
  if (!filterValue || filterValue === 'all') return true;
  if (filterValue === 'HIGH') return isTaskUrgentPriority(taskPriority);
  if (filterValue === 'NORMAL') return !isTaskUrgentPriority(taskPriority);
  return taskPriority === filterValue;
}
