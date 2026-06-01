import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
import type { PayrollMatrixCellState } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

/**
 * Single calendar-style grid cell shared by every payroll grid view
 * (Employee × Order, Order × Employees, Employee history). The box look and the
 * state palette are intentionally identical across views so the three modes read
 * as one product surface.
 */
const PAYROLL_MATRIX_CELL_BOX_BASE =
  'flex min-h-[3.5rem] w-full flex-col items-stretch justify-center rounded-md border px-1';

/**
 * Resolve the box className for a cell state. `null` (or `UNLINKED`) is the
 * colorless / no-link cell: dashed and muted when empty, solid-muted when it
 * still carries a historical value.
 */
export function payrollMatrixCellBoxClass(
  state: PayrollMatrixCellState | null,
  hasValue: boolean,
): string {
  if (state == null || state === 'UNLINKED') {
    return cn(
      PAYROLL_MATRIX_CELL_BOX_BASE,
      hasValue
        ? 'border-border bg-muted/25 text-foreground'
        : 'border-border border-dashed bg-muted/15 text-muted-foreground',
    );
  }
  return cn(PAYROLL_MATRIX_CELL_BOX_BASE, 'border-transparent', PAYROLL_MATRIX_CELL_CLASS[state]);
}
