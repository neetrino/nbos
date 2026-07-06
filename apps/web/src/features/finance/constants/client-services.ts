import type { StatusVariant } from '@/components/shared/StatusBadge';

export const CLIENT_SERVICE_TYPES = [
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'LICENSE', label: 'License' },
] as const;

export const CLIENT_SERVICE_STATUSES = [
  { value: 'PENDING', label: 'Pending', variant: 'amber' as StatusVariant },
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'SUSPENDED', label: 'Suspended', variant: 'gray' as StatusVariant },
  { value: 'EXPIRING_SOON', label: 'Expiring soon', variant: 'red' as StatusVariant },
  { value: 'EXPIRED', label: 'Expired', variant: 'red' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'gray' as StatusVariant },
] as const;

/** Compact labels for client service detail sheet status segmented control. */
export const CLIENT_SERVICE_STATUS_SEGMENTED_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'EXPIRING_SOON', label: 'Expiring' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const CLIENT_SERVICE_TYPE_SEGMENTED_OPTIONS = CLIENT_SERVICE_TYPES;

export const CLIENT_SERVICE_BILLING_MODELS = [
  { value: 'WE_PAY', label: 'We Pay' },
  { value: 'REMINDER_ONLY', label: 'Reminder Only' },
] as const;

/** Compact labels for client service billing model segmented control. */
export const CLIENT_SERVICE_BILLING_MODEL_SEGMENTED_OPTIONS = [
  { value: 'WE_PAY', label: 'We pay' },
  { value: 'REMINDER_ONLY', label: 'Reminder' },
] as const;

export const CLIENT_SERVICE_PRICING_MODELS = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'USAGE_BASED', label: 'Usage-based' },
] as const;

/** Compact labels for client service pricing segmented control. */
export const CLIENT_SERVICE_PRICING_MODEL_SEGMENTED_OPTIONS = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'USAGE_BASED', label: 'Usage' },
] as const;

export const CLIENT_SERVICE_FREQUENCIES = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MULTI_YEAR', label: 'Multi-year' },
] as const;

/** Compact labels for client service frequency segmented control. */
export const CLIENT_SERVICE_FREQUENCY_SEGMENTED_OPTIONS = [
  { value: 'ONE_TIME', label: 'Once' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarter' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MULTI_YEAR', label: 'Multi-yr' },
] as const;

export function clientServiceOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}

export function getClientServiceStatus(value: string | null | undefined) {
  if (!value) return undefined;
  return CLIENT_SERVICE_STATUSES.find((status) => status.value === value);
}
