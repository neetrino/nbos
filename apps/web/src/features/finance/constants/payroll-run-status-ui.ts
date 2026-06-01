import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { cn } from '@/lib/utils';

const PAYROLL_RUN_LIST_ROW_BASE =
  'border-border border-b bg-card transition-colors border-l-4 hover:bg-muted/35';

const PAYROLL_RUN_STATUS_LIST_BORDER: Record<PayrollRunStatus, string> = {
  DRAFT: 'border-l-zinc-400/50',
  REVIEW: 'border-l-amber-400/70',
  APPROVED: 'border-l-blue-500',
  PAYING: 'border-l-orange-400/80',
  CLOSED: 'border-l-emerald-500',
};

const PAYROLL_RUN_STATUS_LIST_TINT: Record<PayrollRunStatus, string> = {
  DRAFT: 'bg-card',
  REVIEW: 'bg-amber-500/[0.04]',
  APPROVED: 'bg-blue-500/[0.04]',
  PAYING: 'bg-orange-500/[0.04]',
  CLOSED: 'bg-emerald-500/[0.04]',
};

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

/** List rows — left stripe + soft tint (aligned with unit-economics hierarchy). */
export const PAYROLL_RUN_STATUS_LIST_ROW_CLASS: Record<PayrollRunStatus, string> = {
  DRAFT: cn(
    PAYROLL_RUN_LIST_ROW_BASE,
    PAYROLL_RUN_STATUS_LIST_BORDER.DRAFT,
    PAYROLL_RUN_STATUS_LIST_TINT.DRAFT,
  ),
  REVIEW: cn(
    PAYROLL_RUN_LIST_ROW_BASE,
    PAYROLL_RUN_STATUS_LIST_BORDER.REVIEW,
    PAYROLL_RUN_STATUS_LIST_TINT.REVIEW,
  ),
  APPROVED: cn(
    PAYROLL_RUN_LIST_ROW_BASE,
    PAYROLL_RUN_STATUS_LIST_BORDER.APPROVED,
    PAYROLL_RUN_STATUS_LIST_TINT.APPROVED,
  ),
  PAYING: cn(
    PAYROLL_RUN_LIST_ROW_BASE,
    PAYROLL_RUN_STATUS_LIST_BORDER.PAYING,
    PAYROLL_RUN_STATUS_LIST_TINT.PAYING,
  ),
  CLOSED: cn(
    PAYROLL_RUN_LIST_ROW_BASE,
    PAYROLL_RUN_STATUS_LIST_BORDER.CLOSED,
    PAYROLL_RUN_STATUS_LIST_TINT.CLOSED,
  ),
};

export function payrollRunListRowClass(status: PayrollRunStatus): string {
  return PAYROLL_RUN_STATUS_LIST_ROW_CLASS[status] ?? PAYROLL_RUN_STATUS_LIST_ROW_CLASS.DRAFT;
}
