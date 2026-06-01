export const CLIENT_SERVICE_TYPES = [
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'LICENSE', label: 'License' },
] as const;

export const CLIENT_SERVICE_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const CLIENT_SERVICE_BILLING_MODELS = [
  { value: 'WE_PAY', label: 'We Pay' },
  { value: 'REMINDER_ONLY', label: 'Reminder Only' },
] as const;

export const CLIENT_SERVICE_PRICING_MODELS = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'USAGE_BASED', label: 'Usage-based' },
] as const;

export const CLIENT_SERVICE_FREQUENCIES = [
  { value: 'ONE_TIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'MULTI_YEAR', label: 'Multi-year' },
] as const;

export function clientServiceOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string {
  return options.find((option) => option.value === value)?.label ?? value ?? '-';
}
