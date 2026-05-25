import type { Subscription } from '@/lib/api/finance';
import type { SubscriptionGridCell, SubscriptionGridCellKind } from '@/lib/api/finance';

export function buildSubscriptionsById(subscriptions: Subscription[]): Map<string, Subscription> {
  return new Map(subscriptions.map((sub) => [sub.id, sub]));
}

export function currentMonthIndexForYear(year: number): number | null {
  const now = new Date();
  if (year !== now.getFullYear()) return null;
  return now.getMonth();
}

export function monthCellKindLabel(kind: SubscriptionGridCellKind): string | null {
  switch (kind) {
    case 'OVERDUE_INVOICE':
      return 'Overdue this month';
    case 'PENDING_INVOICE':
      return 'Invoice pending';
    case 'PAID':
      return 'Paid this month';
    case 'FORECAST':
      return 'Forecast';
    case 'SUBSCRIPTION_PENDING':
      return 'Billing not started';
    case 'MISSED':
      return 'Missed month';
    default:
      return null;
  }
}

export function pickMonthCell(
  months: SubscriptionGridCell[],
  monthIndex: number | null,
): SubscriptionGridCell | null {
  if (monthIndex === null) return null;
  return months[monthIndex] ?? null;
}
