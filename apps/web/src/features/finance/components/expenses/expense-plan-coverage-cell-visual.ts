import {
  FINANCE_CALENDAR_CELL_BLUE,
  FINANCE_CALENDAR_CELL_GREEN,
  FINANCE_CALENDAR_CELL_MUTED,
  FINANCE_CALENDAR_CELL_ORANGE,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import type { ExpensePlanGridCellKind, ExpensePlanGridRow } from '@/lib/api/expense-plans';

export function expensePlanMonthCellVisualClass(kind: ExpensePlanGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return FINANCE_CALENDAR_CELL_GREEN;
    case 'PARTIAL':
    case 'OVERDUE':
      return FINANCE_CALENDAR_CELL_ORANGE;
    case 'OPEN':
      return FINANCE_CALENDAR_CELL_BLUE;
    case 'FORECAST':
      return FINANCE_CALENDAR_CELL_MUTED;
    default:
      return 'border-border bg-muted/20 text-muted-foreground';
  }
}

export function expensePlanMonthCellStatusLabel(kind: ExpensePlanGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'Paid';
    case 'PARTIAL':
      return 'Partial';
    case 'OVERDUE':
      return 'Overdue';
    case 'OPEN':
      return 'Open';
    case 'FORECAST':
      return 'Forecast';
    default:
      return '';
  }
}

export function sortExpensePlanGridRows(rows: ExpensePlanGridRow[]): ExpensePlanGridRow[] {
  return [...rows].sort((a, b) => {
    const byAmount = a.amount - b.amount;
    if (byAmount !== 0) return byAmount;
    return a.planName.localeCompare(b.planName, undefined, { sensitivity: 'base' });
  });
}
