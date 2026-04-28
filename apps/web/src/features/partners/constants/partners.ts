import type { StatusVariant } from '@/components/shared/StatusBadge';

/** `Partner.type` in Prisma (tier). */
export const PARTNER_TYPES = [
  { value: 'REGULAR', label: 'Regular', variant: 'gray' as StatusVariant },
  { value: 'PREMIUM', label: 'Premium', variant: 'amber' as StatusVariant },
] as const;

/** `Partner.direction` in Prisma. */
export const PARTNER_DIRECTIONS = [
  { value: 'INBOUND', label: 'Inbound', variant: 'green' as StatusVariant },
  { value: 'OUTBOUND', label: 'Outbound', variant: 'blue' as StatusVariant },
  { value: 'BOTH', label: 'Both', variant: 'purple' as StatusVariant },
] as const;

export const PARTNER_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'INACTIVE', label: 'Inactive', variant: 'gray' as StatusVariant },
] as const;

export function getPartnerType(value: string) {
  return PARTNER_TYPES.find((t) => t.value === value);
}

export function getPartnerDirection(value: string) {
  return PARTNER_DIRECTIONS.find((d) => d.value === value);
}

export function getPartnerStatus(value: string) {
  return PARTNER_STATUSES.find((s) => s.value === value);
}
