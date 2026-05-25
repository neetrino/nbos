import type { StatusVariant } from '@/components/shared/StatusBadge';

/** Partner tier (`Partner.level` in API; Prisma `Partner.type`). */
export const PARTNER_LEVELS = [
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
  { value: 'PAUSED', label: 'Paused', variant: 'amber' as StatusVariant },
  { value: 'TERMINATED', label: 'Terminated', variant: 'gray' as StatusVariant },
] as const;

export const PARTNER_AGREEMENT_STATUSES = [
  { value: 'NO_AGREEMENT', label: 'No agreement', variant: 'gray' as StatusVariant },
  { value: 'DRAFT', label: 'Draft', variant: 'blue' as StatusVariant },
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'EXPIRED', label: 'Expired', variant: 'amber' as StatusVariant },
] as const;

export function getPartnerLevel(value: string) {
  return PARTNER_LEVELS.find((t) => t.value === value);
}

export function getPartnerDirection(value: string) {
  return PARTNER_DIRECTIONS.find((d) => d.value === value);
}

export function getPartnerStatus(value: string) {
  return PARTNER_STATUSES.find((s) => s.value === value);
}

export function getPartnerAgreementStatus(value: string) {
  return PARTNER_AGREEMENT_STATUSES.find((s) => s.value === value);
}

export {
  DEFAULT_PARTNER_DEFAULT_PERCENT,
  PARTNER_DEFAULT_PERCENT_MIN,
  PARTNER_DEFAULT_PERCENT_MAX,
} from '../utils/partner-default-percent';
