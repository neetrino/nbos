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

export const TASK_PRIORITIES = [
  { value: 'CRITICAL', label: 'Critical', variant: 'red' as StatusVariant, color: 'text-red-500' },
  { value: 'HIGH', label: 'High', variant: 'orange' as StatusVariant, color: 'text-orange-500' },
  { value: 'NORMAL', label: 'Normal', variant: 'blue' as StatusVariant, color: 'text-blue-500' },
  { value: 'LOW', label: 'Low', variant: 'gray' as StatusVariant, color: 'text-gray-400' },
] as const;

export function getTaskStatus(value: string) {
  return TASK_STATUSES.find((s) => s.value === value);
}

export function getTaskPriority(value: string) {
  return TASK_PRIORITIES.find((p) => p.value === value);
}

const TASK_HIGH_PRIORITIES = new Set<string>(['HIGH', 'CRITICAL']);

/** Matches quick-create flame: HIGH/CRITICAL vs everything else. */
export function isTaskHighPriority(priority: string): boolean {
  return TASK_HIGH_PRIORITIES.has(priority);
}

/** Toggle urgent flag the same way as {@link QuickCreateTaskDialog}. */
export function toggleTaskHighPriority(priority: string): string {
  return isTaskHighPriority(priority) ? 'NORMAL' : 'HIGH';
}
