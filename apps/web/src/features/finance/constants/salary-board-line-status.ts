import type { StatusVariant } from '@/components/shared/StatusBadge';
import {
  FINANCE_CALENDAR_CELL_AMBER,
  FINANCE_CALENDAR_CELL_BLUE,
  FINANCE_CALENDAR_CELL_GREEN,
  FINANCE_CALENDAR_CELL_MUTED,
  FINANCE_CALENDAR_CELL_ORANGE,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import type { SalaryLineStatus } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const SALARY_LINE_LIST_ROW_BASE =
  'border-border border-b bg-card transition-colors border-l-4 hover:bg-muted/35';

const SALARY_LINE_STATUS_LIST_BORDER: Record<SalaryLineStatus, string> = {
  PENDING: 'border-l-amber-400/70',
  APPROVED: 'border-l-blue-500',
  PARTIALLY_PAID: 'border-l-orange-400/80',
  PAID: 'border-l-emerald-500',
  HELD: 'border-l-zinc-400/60',
};

const SALARY_LINE_STATUS_LIST_TINT: Record<SalaryLineStatus, string> = {
  PENDING: 'bg-amber-500/[0.04]',
  APPROVED: 'bg-blue-500/[0.04]',
  PARTIALLY_PAID: 'bg-orange-500/[0.04]',
  PAID: 'bg-emerald-500/[0.04]',
  HELD: 'bg-muted/25',
};

export const SALARY_LINE_STATUS_BOARD: Record<
  SalaryLineStatus,
  { label: string; variant: StatusVariant }
> = {
  PENDING: { label: 'Pending', variant: 'amber' },
  APPROVED: { label: 'Approved', variant: 'blue' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'orange' },
  PAID: { label: 'Paid', variant: 'green' },
  HELD: { label: 'Held', variant: 'gray' },
};

export function salaryLineStatusBoardUi(status: SalaryLineStatus) {
  return SALARY_LINE_STATUS_BOARD[status] ?? { label: status, variant: 'gray' as StatusVariant };
}

/** Calendar cells — shared finance calendar palette. */
export const SALARY_LINE_STATUS_CALENDAR_CELL_CLASS: Record<SalaryLineStatus, string> = {
  PENDING: FINANCE_CALENDAR_CELL_AMBER,
  APPROVED: FINANCE_CALENDAR_CELL_BLUE,
  PARTIALLY_PAID: FINANCE_CALENDAR_CELL_ORANGE,
  PAID: FINANCE_CALENDAR_CELL_GREEN,
  HELD: FINANCE_CALENDAR_CELL_MUTED,
};

export function salaryLineCalendarCellClass(status: SalaryLineStatus): string {
  return (
    SALARY_LINE_STATUS_CALENDAR_CELL_CLASS[status] ?? SALARY_LINE_STATUS_CALENDAR_CELL_CLASS.PENDING
  );
}

/** List rows — left stripe + soft tint (aligned with unit-economics hierarchy). */
export const SALARY_LINE_STATUS_LIST_ROW_CLASS: Record<SalaryLineStatus, string> = {
  PENDING: cn(
    SALARY_LINE_LIST_ROW_BASE,
    SALARY_LINE_STATUS_LIST_BORDER.PENDING,
    SALARY_LINE_STATUS_LIST_TINT.PENDING,
  ),
  APPROVED: cn(
    SALARY_LINE_LIST_ROW_BASE,
    SALARY_LINE_STATUS_LIST_BORDER.APPROVED,
    SALARY_LINE_STATUS_LIST_TINT.APPROVED,
  ),
  PARTIALLY_PAID: cn(
    SALARY_LINE_LIST_ROW_BASE,
    SALARY_LINE_STATUS_LIST_BORDER.PARTIALLY_PAID,
    SALARY_LINE_STATUS_LIST_TINT.PARTIALLY_PAID,
  ),
  PAID: cn(
    SALARY_LINE_LIST_ROW_BASE,
    SALARY_LINE_STATUS_LIST_BORDER.PAID,
    SALARY_LINE_STATUS_LIST_TINT.PAID,
  ),
  HELD: cn(
    SALARY_LINE_LIST_ROW_BASE,
    SALARY_LINE_STATUS_LIST_BORDER.HELD,
    SALARY_LINE_STATUS_LIST_TINT.HELD,
  ),
};

export function salaryLineListRowClass(status: SalaryLineStatus): string {
  return SALARY_LINE_STATUS_LIST_ROW_CLASS[status] ?? SALARY_LINE_STATUS_LIST_ROW_CLASS.PENDING;
}
