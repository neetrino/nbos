import type { PayrollMatrixCellState } from '@/lib/api/payroll-allocation-matrix';

export const PAYROLL_MATRIX_CELL_CLASS: Record<PayrollMatrixCellState, string> = {
  UNLINKED: 'bg-card text-muted-foreground',
  LINKED_EMPTY: 'bg-sky-500/15 text-sky-900 dark:text-sky-100',
  READY: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
  PARTIALLY_FUNDED: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
  PROGRESS: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
  MANUAL_BONUS: 'bg-orange-500/15 text-orange-900 dark:text-orange-100',
  RELEASE_SET: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
  EXTRA_BONUS: 'bg-amber-500/20 text-amber-950 dark:text-amber-100',
  OVER_FUNDING: 'bg-red-500/15 text-red-900 dark:text-red-100',
  INVALID: 'bg-destructive/15 text-destructive',
};
