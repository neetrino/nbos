import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';

export const PAYROLL_RUN_STATUS_UI: Record<
  PayrollRunStatus,
  { label: string; variant: StatusVariant }
> = {
  DRAFT: { label: PAYROLL_RUN_STATUS_LABEL.DRAFT, variant: 'zinc' },
  REVIEW: { label: PAYROLL_RUN_STATUS_LABEL.REVIEW, variant: 'amber' },
  APPROVED: { label: PAYROLL_RUN_STATUS_LABEL.APPROVED, variant: 'blue' },
  PAYING: { label: PAYROLL_RUN_STATUS_LABEL.PAYING, variant: 'orange' },
  CLOSED: { label: PAYROLL_RUN_STATUS_LABEL.CLOSED, variant: 'green' },
};

export function payrollRunStatusUi(status: PayrollRunStatus) {
  return PAYROLL_RUN_STATUS_UI[status] ?? { label: status, variant: 'gray' as StatusVariant };
}

/** Full-cell calendar styling aligned with {@link StatusBadge} variants. */
export const PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS: Record<PayrollRunStatus, string> = {
  DRAFT:
    'border-zinc-300 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  REVIEW:
    'border-amber-200/80 bg-amber-100 text-amber-900 hover:bg-amber-200/70 dark:border-amber-800/50 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/50',
  APPROVED:
    'border-blue-200/80 bg-blue-100 text-blue-900 hover:bg-blue-200/70 dark:border-blue-800/50 dark:bg-blue-900/35 dark:text-blue-200 dark:hover:bg-blue-900/50',
  PAYING:
    'border-orange-200/80 bg-orange-100 text-orange-900 hover:bg-orange-200/70 dark:border-orange-800/50 dark:bg-orange-900/35 dark:text-orange-200 dark:hover:bg-orange-900/50',
  CLOSED:
    'border-green-200/80 bg-green-100 text-green-900 hover:bg-green-200/70 dark:border-green-800/50 dark:bg-green-900/35 dark:text-green-200 dark:hover:bg-green-900/50',
};

export function payrollRunCalendarCellClass(status: PayrollRunStatus): string {
  return (
    PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS[status] ?? PAYROLL_RUN_STATUS_CALENDAR_CELL_CLASS.DRAFT
  );
}
