import type { StatusVariant } from '@/components/shared/StatusBadge';

export const TASK_STATUSES = [
  { value: 'BACKLOG', label: 'Backlog', variant: 'gray' as StatusVariant, color: 'bg-gray-400' },
  { value: 'TODO', label: 'To Do', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    variant: 'purple' as StatusVariant,
    color: 'bg-purple-500',
  },
  { value: 'REVIEW', label: 'Review', variant: 'amber' as StatusVariant, color: 'bg-amber-500' },
  { value: 'DONE', label: 'Done', variant: 'green' as StatusVariant, color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'red' as StatusVariant, color: 'bg-red-400' },
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
