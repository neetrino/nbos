import {
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_STICKY_HEADER_SHADOW,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import { cn } from '@/lib/utils';

/**
 * Expansion UX (column vs row):
 * - Primary header (clicked row/column label) → active green tint on that header only.
 * - Detail surface only → extra column strip OR extra detail row, soft green tint.
 * - Main matrix data cells keep normal state colors (not the full column on expand).
 */

/** Extra column in thead — Planned/Paid (or Payable/Bonus). */
export const PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-1.5 pt-2 pb-2 align-top',
);

/** Extra row — sticky summary cell (employee/order totals). */
export const PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_STICKY_HEADER_SHADOW,
  'border-border sticky left-0 z-30 border-r border-b px-3 py-1 align-middle',
);

/** Due/Paid cells in the detail column or detail row. */
export const PAYROLL_MATRIX_EXPANSION_CELL_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-1.5 py-1 align-middle',
);
