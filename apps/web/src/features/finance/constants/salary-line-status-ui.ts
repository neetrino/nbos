import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { SalaryLineStatus } from '@/lib/api/payroll-runs';
import {
  SALARY_LINE_STATUS_BOARD,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-board-line-status';

export { salaryLineStatusBoardUi };

/** Full calendar cell tint aligned with {@link SALARY_LINE_STATUS_BOARD} variants. */
export const SALARY_LINE_STATUS_CALENDAR_CELL_CLASS: Record<SalaryLineStatus, string> = {
  PENDING:
    'border-amber-200/80 bg-amber-50 text-amber-950 hover:bg-amber-100/90 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/55',
  APPROVED:
    'border-blue-200/80 bg-blue-50 text-blue-950 hover:bg-blue-100/90 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-900/55',
  PARTIALLY_PAID:
    'border-orange-200/80 bg-orange-50 text-orange-950 hover:bg-orange-100/90 dark:border-orange-800/50 dark:bg-orange-950/40 dark:text-orange-100 dark:hover:bg-orange-900/55',
  PAID: 'border-green-200/80 bg-green-50 text-green-950 hover:bg-green-100/90 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-100 dark:hover:bg-green-900/55',
  HELD: 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-700',
};

export function salaryLineCalendarCellClass(status: SalaryLineStatus): string {
  return (
    SALARY_LINE_STATUS_CALENDAR_CELL_CLASS[status] ?? SALARY_LINE_STATUS_CALENDAR_CELL_CLASS.PENDING
  );
}

export function salaryLineStatusVariant(status: SalaryLineStatus): StatusVariant {
  return salaryLineStatusBoardUi(status).variant;
}
