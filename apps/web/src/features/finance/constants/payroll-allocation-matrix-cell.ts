import type { PayrollMatrixCellState } from '@/lib/api/payroll-allocation-matrix';

export const PAYROLL_MATRIX_CELL_CLASS: Record<PayrollMatrixCellState, string> = {
  UNLINKED: 'bg-card text-muted-foreground',
  LINKED_EMPTY: 'bg-sky-500/15 text-black dark:text-black',
  READY: 'bg-emerald-500/15 text-black dark:text-black',
  PARTIALLY_FUNDED: 'bg-emerald-500/15 text-black dark:text-black',
  PROGRESS: 'bg-emerald-500/15 text-black dark:text-black',
  MANUAL_BONUS: 'bg-orange-500/15 text-black dark:text-black',
  RELEASE_SET: 'bg-emerald-500/15 text-black dark:text-black',
  EXTRA_BONUS: 'bg-amber-500/20 text-black dark:text-black',
  OVER_FUNDING: 'bg-red-500/15 text-black dark:text-black',
  INVALID: 'bg-destructive/15 text-black dark:text-black',
};
