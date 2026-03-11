import type { StatusVariant } from '@/components/shared/StatusBadge';

export const PARTNER_TYPES = [
  { value: 'INBOUND', label: 'Inbound', variant: 'green' as StatusVariant },
  { value: 'OUTBOUND', label: 'Outbound', variant: 'blue' as StatusVariant },
  { value: 'BOTH', label: 'Both', variant: 'purple' as StatusVariant },
] as const;

export const PARTNER_LEVELS = [
  { value: 'REGULAR', label: 'Regular', variant: 'gray' as StatusVariant },
  { value: 'PREMIUM', label: 'Premium', variant: 'amber' as StatusVariant },
] as const;

export const AGREEMENT_STATUSES = [
  { value: 'NO_AGREEMENT', label: 'No Agreement', variant: 'gray' as StatusVariant },
  { value: 'DRAFT', label: 'Draft', variant: 'blue' as StatusVariant },
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'EXPIRED', label: 'Expired', variant: 'red' as StatusVariant },
] as const;

export const PARTNER_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'PAUSED', label: 'Paused', variant: 'amber' as StatusVariant },
  { value: 'TERMINATED', label: 'Terminated', variant: 'red' as StatusVariant },
] as const;

export function getPartnerType(value: string) {
  return PARTNER_TYPES.find((t) => t.value === value);
}

export function getPartnerLevel(value: string) {
  return PARTNER_LEVELS.find((l) => l.value === value);
}

export function getAgreementStatus(value: string) {
  return AGREEMENT_STATUSES.find((s) => s.value === value);
}

export function getPartnerStatus(value: string) {
  return PARTNER_STATUSES.find((s) => s.value === value);
}
