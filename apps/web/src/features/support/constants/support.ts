import type { StatusVariant } from '@/components/shared/StatusBadge';

export const TICKET_CATEGORIES = [
  { value: 'INCIDENT', label: 'Incident', variant: 'red' as StatusVariant },
  { value: 'SERVICE_REQUEST', label: 'Service Request', variant: 'blue' as StatusVariant },
  { value: 'CHANGE_REQUEST', label: 'Change Request', variant: 'purple' as StatusVariant },
  { value: 'PROBLEM', label: 'Problem', variant: 'orange' as StatusVariant },
] as const;

export const TICKET_PRIORITIES = [
  { value: 'P1', label: 'P1 Critical', variant: 'red' as StatusVariant },
  { value: 'P2', label: 'P2 High', variant: 'orange' as StatusVariant },
  { value: 'P3', label: 'P3 Normal', variant: 'blue' as StatusVariant },
] as const;

export const TICKET_STATUSES = [
  { value: 'NEW', label: 'New', variant: 'blue' as StatusVariant, color: 'bg-blue-500' },
  {
    value: 'TRIAGED',
    label: 'Triaged',
    variant: 'indigo' as StatusVariant,
    color: 'bg-indigo-500',
  },
  {
    value: 'ASSIGNED',
    label: 'Assigned',
    variant: 'purple' as StatusVariant,
    color: 'bg-purple-500',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    variant: 'amber' as StatusVariant,
    color: 'bg-amber-500',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved',
    variant: 'green' as StatusVariant,
    color: 'bg-green-500',
  },
  { value: 'CLOSED', label: 'Closed', variant: 'gray' as StatusVariant, color: 'bg-gray-400' },
] as const;

export function getTicketCategory(value: string) {
  return TICKET_CATEGORIES.find((c) => c.value === value);
}

export function getTicketPriority(value: string) {
  return TICKET_PRIORITIES.find((p) => p.value === value);
}

export function getTicketStatus(value: string) {
  return TICKET_STATUSES.find((s) => s.value === value);
}
