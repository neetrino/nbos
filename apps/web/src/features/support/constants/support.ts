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

export const TICKET_COVERAGE_DECISIONS = [
  {
    value: 'COVERED_BY_MAINTENANCE',
    label: 'Maintenance',
    variant: 'green' as StatusVariant,
  },
  { value: 'FREE_GOODWILL', label: 'Goodwill', variant: 'blue' as StatusVariant },
  { value: 'BILLABLE_SMALL_WORK', label: 'Billable small work', variant: 'amber' as StatusVariant },
  { value: 'EXTENSION_REQUIRED', label: 'Extension required', variant: 'purple' as StatusVariant },
  { value: 'NOT_COVERED_REJECTED', label: 'Rejected', variant: 'red' as StatusVariant },
] as const;

export const TICKET_SLA_STATES = [
  { value: 'ON_TRACK', label: 'On track', variant: 'green' as StatusVariant },
  { value: 'AT_RISK', label: 'At risk', variant: 'amber' as StatusVariant },
  { value: 'HIGH_RISK', label: 'High risk', variant: 'orange' as StatusVariant },
  { value: 'BREACHED', label: 'Breached', variant: 'red' as StatusVariant },
  { value: 'PAUSED', label: 'SLA paused', variant: 'gray' as StatusVariant },
  { value: 'CLOSED', label: 'Closed', variant: 'gray' as StatusVariant },
] as const;

export const TICKET_WAITING_STATES = [
  { value: 'all', label: 'All waiting states' },
  { value: 'NONE', label: 'Not waiting' },
  { value: 'WAITING_FOR_CLIENT', label: 'Waiting for client' },
  { value: 'WAITING_FOR_THIRD_PARTY', label: 'Waiting for third party' },
  { value: 'ESCALATED', label: 'Escalated' },
] as const;

export const TICKET_WAITING_OVERLAY_OPTIONS = TICKET_WAITING_STATES.filter(
  (w) => w.value !== 'all',
);

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

export function getTicketCoverage(value: string | null) {
  if (!value) return undefined;
  return TICKET_COVERAGE_DECISIONS.find((c) => c.value === value);
}

export function getTicketSlaState(value: string) {
  return TICKET_SLA_STATES.find((state) => state.value === value);
}

export function getTicketWaitingState(value: string) {
  return TICKET_WAITING_STATES.find((w) => w.value === value);
}

export function getTicketStatus(value: string) {
  return TICKET_STATUSES.find((s) => s.value === value);
}
