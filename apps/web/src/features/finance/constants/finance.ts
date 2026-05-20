import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { FinanceDateRangeParams } from '@/lib/api/finance-common';

export const INVOICE_TYPES = [
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'DOMAIN_SERVICE', label: 'Domain / Service' },
] as const;

/** Invoice Card money status (canonical). */
export const INVOICE_MONEY_STAGES = [
  { value: 'NEW', label: 'New', variant: 'blue' as StatusVariant },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting payment', variant: 'purple' as StatusVariant },
  { value: 'OVERDUE', label: 'Overdue', variant: 'orange' as StatusVariant },
  { value: 'ON_HOLD', label: 'On hold', variant: 'gray' as StatusVariant },
  { value: 'PAID', label: 'Paid', variant: 'green' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'red' as StatusVariant },
] as const;

export const EXPENSE_STAGES = [
  { value: 'PLANNED', label: 'Planned', variant: 'blue' as StatusVariant },
  { value: 'DUE_SOON', label: 'Due Soon', variant: 'purple' as StatusVariant },
  { value: 'DUE_NOW', label: 'Due Now', variant: 'orange' as StatusVariant },
  { value: 'OVERDUE', label: 'Overdue', variant: 'red' as StatusVariant },
  { value: 'ON_HOLD', label: 'On Hold', variant: 'gray' as StatusVariant },
  { value: 'BACKLOG', label: 'Backlog', variant: 'amber' as StatusVariant },
  { value: 'PAID', label: 'Paid', variant: 'green' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'gray' as StatusVariant },
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
  { value: 'MAINTENANCE_ONLY', label: 'Maintenance', variant: 'green' as StatusVariant },
  { value: 'DEV_AND_MAINTENANCE', label: 'Dev + Maintenance', variant: 'blue' as StatusVariant },
  { value: 'DEV_ONLY', label: 'Development Only', variant: 'purple' as StatusVariant },
  { value: 'PARTNER_SERVICE', label: 'Partner Service', variant: 'orange' as StatusVariant },
] as const;

export const SUBSCRIPTION_BILLING_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: 'PENDING', label: 'Pending', variant: 'amber' as StatusVariant },
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'ON_HOLD', label: 'On Hold', variant: 'gray' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'red' as StatusVariant },
  { value: 'COMPLETED', label: 'Completed', variant: 'blue' as StatusVariant },
] as const;

export const FINANCE_PERIOD_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
] as const;

export type FinancePeriod = (typeof FINANCE_PERIOD_OPTIONS)[number]['value'];

export function getInvoiceMoneyStage(value: string | undefined) {
  if (!value) return undefined;
  return INVOICE_MONEY_STAGES.find((s) => s.value === value);
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

export function getSubscriptionBillingFrequency(value: string) {
  return SUBSCRIPTION_BILLING_FREQUENCIES.find((f) => f.value === value);
}

export function formatAmount(amount: number, currency = 'AMD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toApiDate(date: Date): string {
  return date.toISOString();
}

export function getFinancePeriodParams(period: FinancePeriod): FinanceDateRangeParams | undefined {
  if (period === 'all') {
    return undefined;
  }

  const now = new Date();
  const start = new Date(now);

  if (period === 'month') {
    start.setDate(1);
  } else if (period === 'quarter') {
    start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    start.setMonth(0, 1);
  }

  start.setHours(0, 0, 0, 0);

  return {
    dateFrom: toApiDate(start),
    dateTo: toApiDate(now),
  };
}
