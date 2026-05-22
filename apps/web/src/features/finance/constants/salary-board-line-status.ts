import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { SalaryLineStatus } from '@/lib/api/payroll-runs';

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

/** Calendar cells — same saturation pattern as payroll run calendar. */
export const SALARY_LINE_STATUS_CALENDAR_CELL_CLASS: Record<SalaryLineStatus, string> = {
  PENDING:
    'border-amber-200/80 bg-amber-100 text-amber-900 hover:bg-amber-200/70 dark:border-amber-800/50 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/50',
  APPROVED:
    'border-blue-200/80 bg-blue-100 text-blue-900 hover:bg-blue-200/70 dark:border-blue-800/50 dark:bg-blue-900/35 dark:text-blue-200 dark:hover:bg-blue-900/50',
  PARTIALLY_PAID:
    'border-orange-200/80 bg-orange-100 text-orange-900 hover:bg-orange-200/70 dark:border-orange-800/50 dark:bg-orange-900/35 dark:text-orange-200 dark:hover:bg-orange-900/50',
  PAID: 'border-green-200/80 bg-green-100 text-green-900 hover:bg-green-200/70 dark:border-green-800/50 dark:bg-green-900/35 dark:text-green-200 dark:hover:bg-green-900/50',
  HELD: 'border-zinc-300/80 bg-muted/40 text-zinc-800 hover:bg-muted/60 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700',
};

export function salaryLineCalendarCellClass(status: SalaryLineStatus): string {
  return (
    SALARY_LINE_STATUS_CALENDAR_CELL_CLASS[status] ?? SALARY_LINE_STATUS_CALENDAR_CELL_CLASS.PENDING
  );
}
