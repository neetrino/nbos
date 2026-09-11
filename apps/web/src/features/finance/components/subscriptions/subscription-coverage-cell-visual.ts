import {
  FINANCE_CALENDAR_CELL_AMBER,
  FINANCE_CALENDAR_CELL_BLUE,
  FINANCE_CALENDAR_CELL_GREEN,
  FINANCE_CALENDAR_CELL_MUTED,
  FINANCE_CALENDAR_CELL_ORANGE,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import type { SubscriptionGridCellKind } from '@/lib/api/finance';

/** Color tokens for a coverage-grid month cell. */
export function subscriptionMonthCellVisualClass(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return FINANCE_CALENDAR_CELL_GREEN;
    case 'PENDING_INVOICE':
      return FINANCE_CALENDAR_CELL_AMBER;
    case 'OVERDUE_INVOICE':
      return FINANCE_CALENDAR_CELL_ORANGE;
    case 'FORECAST':
      return FINANCE_CALENDAR_CELL_BLUE;
    case 'SUBSCRIPTION_PENDING':
      return FINANCE_CALENDAR_CELL_AMBER;
    case 'MISSED':
      return FINANCE_CALENDAR_CELL_MUTED;
    default:
      return 'border-border bg-muted/20 text-muted-foreground';
  }
}

/** Short status word for aria-label / empty-body cells. */
export function subscriptionMonthCellStatusLabel(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'Paid';
    case 'PENDING_INVOICE':
      return 'Invoice';
    case 'OVERDUE_INVOICE':
      return 'Overdue';
    case 'FORECAST':
      return 'Forecast';
    case 'SUBSCRIPTION_PENDING':
      return 'Pending';
    case 'MISSED':
      return 'Missed';
    default:
      return '';
  }
}
