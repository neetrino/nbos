import {
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
  PAYROLL_MATRIX_STICKY_EDGE_STYLE,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import { cn } from '@/lib/utils';

/**
 * Expansion UX (column vs row):
 * - Row header → same width as passive; emerald underline only (`ROW_HEADER_ACTIVE_MARK`).
 * - Row detail → extra `<tr>`; sticky edge shows Planned/Paid (order) or Payable/Bonus (employee).
 * - Column header → green tint + optional Planned/Paid strip in thead.
 */

/** Extra column in thead — Planned/Paid (or Payable/Bonus). */
export const PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-1.5 pt-2 pb-2 align-top',
);

/** Row detail — sticky edge summary (width locked to match row header). */
export const PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
  'border-border sticky left-0 z-30 border-r border-b px-3 py-1 align-top overflow-hidden',
);

export const PAYROLL_MATRIX_EXPANSION_ROW_STICKY_STYLE = PAYROLL_MATRIX_STICKY_EDGE_STYLE;

/** Due/Paid — extra column beside an active header (column expand). */
export const PAYROLL_MATRIX_EXPANSION_CELL_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-1.5 py-1 align-middle',
);

/** Due/Paid — detail row under an active header (same width as data cells). */
export const PAYROLL_MATRIX_EXPANSION_ROW_CELL_CLASS = cn(
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  'border-border border-r border-b px-1.5 py-1 align-middle',
);
