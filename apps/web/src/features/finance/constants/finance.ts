import type { StatusVariant } from '@/components/shared/StatusBadge';

export const INVOICE_TYPES = [
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'DOMAIN_SERVICE', label: 'Domain / Service' },
] as const;

export const INVOICE_STAGES = [
  { value: 'NEW', label: 'New', variant: 'blue' as StatusVariant },
  { value: 'GOV_SYSTEM', label: 'Gov System', variant: 'indigo' as StatusVariant },
  { value: 'SEND_MESSAGE', label: 'Send Message', variant: 'purple' as StatusVariant },
  { value: 'OVERDUE', label: 'Overdue', variant: 'red' as StatusVariant },
  { value: 'ON_HOLD', label: 'On Hold', variant: 'gray' as StatusVariant },
  { value: 'PAID', label: 'Paid', variant: 'green' as StatusVariant },
  { value: 'UNPAID', label: 'Unpaid', variant: 'red' as StatusVariant },
] as const;

export const EXPENSE_STAGES = [
  { value: 'THIS_MONTH', label: 'This Month', variant: 'blue' as StatusVariant },
  { value: 'PAY_NOW', label: 'Pay Now', variant: 'orange' as StatusVariant },
  { value: 'DELAYED', label: 'Delayed', variant: 'amber' as StatusVariant },
  { value: 'ON_HOLD', label: 'On Hold', variant: 'gray' as StatusVariant },
  { value: 'OLD', label: 'Old', variant: 'gray' as StatusVariant },
  { value: 'PAID', label: 'Paid', variant: 'green' as StatusVariant },
  { value: 'UNPAID', label: 'Unpaid', variant: 'red' as StatusVariant },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'PARTNER_PAYOUT', label: 'Partner Payout' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const SUBSCRIPTION_TYPES = [
  { value: 'MAINTENANCE', label: 'Maintenance', variant: 'green' as StatusVariant },
  { value: 'DEV_MAINTENANCE', label: 'Dev + Maintenance', variant: 'blue' as StatusVariant },
  { value: 'DEV_ONLY', label: 'Development Only', variant: 'purple' as StatusVariant },
  { value: 'PARTNER_SERVICE', label: 'Partner Service', variant: 'orange' as StatusVariant },
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'PAUSED', label: 'Paused', variant: 'amber' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'red' as StatusVariant },
] as const;

export function getInvoiceStage(value: string) {
  return INVOICE_STAGES.find((s) => s.value === value);
}

export function getExpenseStage(value: string) {
  return EXPENSE_STAGES.find((s) => s.value === value);
}

export function getSubscriptionType(value: string) {
  return SUBSCRIPTION_TYPES.find((t) => t.value === value);
}

export function getSubscriptionStatus(value: string) {
  return SUBSCRIPTION_STATUSES.find((s) => s.value === value);
}

export function formatAmount(amount: number, currency = 'AMD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
