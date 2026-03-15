import type { StatusVariant } from '@/components/shared/StatusBadge';

export const EMPLOYEE_LEVELS = [
  { value: 'JUNIOR', label: 'Junior', variant: 'gray' as StatusVariant },
  { value: 'MIDDLE', label: 'Middle', variant: 'blue' as StatusVariant },
  { value: 'SENIOR', label: 'Senior', variant: 'purple' as StatusVariant },
  { value: 'LEAD', label: 'Lead', variant: 'orange' as StatusVariant },
  { value: 'HEAD', label: 'Head', variant: 'red' as StatusVariant },
] as const;

export const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'PROBATION', label: 'Probation', variant: 'amber' as StatusVariant },
  { value: 'ON_LEAVE', label: 'On Leave', variant: 'blue' as StatusVariant },
  { value: 'TERMINATED', label: 'Terminated', variant: 'red' as StatusVariant },
] as const;

export function getEmployeeLevel(value: string) {
  return EMPLOYEE_LEVELS.find((l) => l.value === value);
}

export function getEmployeeStatus(value: string) {
  return EMPLOYEE_STATUSES.find((s) => s.value === value);
}
