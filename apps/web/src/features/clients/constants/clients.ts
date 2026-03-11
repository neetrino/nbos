import type { StatusVariant } from '@/components/shared/StatusBadge';

export const CONTACT_ROLES = [
  { value: 'CLIENT', label: 'Client', variant: 'blue' as StatusVariant },
  { value: 'PARTNER', label: 'Partner', variant: 'purple' as StatusVariant },
  { value: 'CONTRACTOR', label: 'Contractor', variant: 'orange' as StatusVariant },
  { value: 'OTHER', label: 'Other', variant: 'gray' as StatusVariant },
] as const;

export const PREFERRED_CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'EMAIL', label: 'Email' },
] as const;

export const LANGUAGES = [
  { value: 'ARMENIAN', label: 'Armenian' },
  { value: 'RUSSIAN', label: 'Russian' },
  { value: 'ENGLISH', label: 'English' },
] as const;

export const CONTACT_SOURCES = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const COMPANY_TYPES = [
  { value: 'LEGAL', label: 'Legal Entity', variant: 'blue' as StatusVariant },
  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietor', variant: 'purple' as StatusVariant },
  { value: 'INDIVIDUAL', label: 'Individual', variant: 'amber' as StatusVariant },
] as const;

export const TAX_STATUSES = [
  { value: 'TAX', label: 'Tax Payer', variant: 'green' as StatusVariant },
  { value: 'TAX_FREE', label: 'Tax Free', variant: 'gray' as StatusVariant },
] as const;

export function getContactRole(value: string) {
  return CONTACT_ROLES.find((r) => r.value === value);
}

export function getCompanyType(value: string) {
  return COMPANY_TYPES.find((t) => t.value === value);
}

export function getTaxStatus(value: string) {
  return TAX_STATUSES.find((s) => s.value === value);
}
