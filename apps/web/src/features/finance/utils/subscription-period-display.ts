import { formatAmount } from '@/features/finance/constants/finance';
import { formatFinanceListDate } from '@/features/finance/components/shared/finance-list-table';
import type { Subscription } from '@/lib/api/subscriptions';

function addCalendarMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function billingDayDate(year: number, monthIndex: number, billingDay: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(billingDay, lastDay));
}

/** Next billing cycle start on or after today. */
export function resolveSubscriptionNextPaymentDate(subscription: Subscription): Date | null {
  if (subscription.status === 'CANCELLED' || subscription.status === 'COMPLETED') {
    return null;
  }

  const start = new Date(subscription.billingStartDate);
  if (Number.isNaN(start.getTime())) return null;

  const monthsPerPeriod = subscription.coverageMonthCount;
  if (!Number.isInteger(monthsPerPeriod) || monthsPerPeriod < 1) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = billingDayDate(start.getFullYear(), start.getMonth(), subscription.billingDay);

  let guard = 0;
  while (cursor.getTime() < today.getTime() && guard < 600) {
    cursor = addCalendarMonths(cursor, monthsPerPeriod);
    cursor = billingDayDate(cursor.getFullYear(), cursor.getMonth(), subscription.billingDay);
    guard += 1;
  }

  return cursor;
}

function billingFrequencyPhrase(billingFrequency: string, coverageMonthCount: number): string {
  if (billingFrequency === 'YEARLY') return 'once a year';
  if (billingFrequency === 'CUSTOM') return `every ${coverageMonthCount} months`;
  return 'once a month';
}

/** Canon-style period statement for subscription cards. */
export function formatSubscriptionPeriodStatement(subscription: Subscription): string {
  const amount = formatAmount(parseFloat(subscription.amount));
  const frequency = billingFrequencyPhrase(
    subscription.billingFrequency,
    subscription.coverageMonthCount,
  );
  const nextPayment = resolveSubscriptionNextPaymentDate(subscription);
  const nextPart = nextPayment
    ? `, next payment ${formatFinanceListDate(nextPayment.toISOString())}`
    : '';
  return `${amount} ${frequency}${nextPart}`;
}

export function formatSubscriptionMonthlyEquivalentLabel(subscription: Subscription): string {
  return `${formatAmount(parseFloat(subscription.monthlyEquivalentAmount))}/mo equiv.`;
}
