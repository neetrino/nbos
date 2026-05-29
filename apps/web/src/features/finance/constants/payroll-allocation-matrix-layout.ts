/** Fixed sticky row/corner width — same in Employee × Order and Order × Employees views. */
export const PAYROLL_MATRIX_STICKY_COL_WIDTH = '11.5rem';

/** Inline width lock — colgroup alone can still grow with wide detail-row content. */
export const PAYROLL_MATRIX_STICKY_EDGE_STYLE = {
  width: PAYROLL_MATRIX_STICKY_COL_WIDTH,
  minWidth: PAYROLL_MATRIX_STICKY_COL_WIDTH,
  maxWidth: PAYROLL_MATRIX_STICKY_COL_WIDTH,
} as const;

export const PAYROLL_MATRIX_STICKY_EDGE_WIDTH =
  'w-[11.5rem] max-w-[11.5rem] min-w-[11.5rem] shrink-0 overflow-hidden box-border';

/** Opaque sticky edge (employee/order names) — must not show scroll-through. */
export const PAYROLL_MATRIX_STICKY_HEADER_BG = 'bg-card';

/** Selected / expanded row or column — solid tint; text stays default foreground. */
export const PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG = 'bg-emerald-50 dark:bg-emerald-950';

/** @deprecated Use PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG for column selection. */
export const PAYROLL_MATRIX_STICKY_HEADER_ACTIVE_BG = PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG;

/** Inset divider — no outward shadow that visually widens the sticky column. */
export const PAYROLL_MATRIX_STICKY_EDGE_DIVIDER = 'shadow-[inset_-1px_0_0_0_var(--border)]';

/** Scrollable matrix body — flex-1 fills remaining viewport; scroll both axes. */
export const PAYROLL_MATRIX_BODY_CLASS =
  'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg';

export const PAYROLL_MATRIX_BODY_FULLSCREEN_CLASS =
  'min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg';

/** `w-max` keeps horizontal overflow; `table-fixed` + colgroup lock sticky column width. */
export const PAYROLL_MATRIX_TABLE_CLASS =
  'w-max min-w-full table-fixed border-separate border-spacing-0 text-xs';

/** Active row header — underline only; same width/background as passive rows. */
export const PAYROLL_MATRIX_ROW_HEADER_ACTIVE_MARK =
  'shadow-[inset_0_-2px_0_0_theme(colors.emerald.500)]';

export const PAYROLL_MATRIX_COLUMN_HEADER_STICKY = 'sticky top-0 z-20';

export const PAYROLL_MATRIX_DATA_COL_WIDTH = 'min-w-[7.5rem]';

/** Sticky employee totals column at the right edge of the matrix. */
export const PAYROLL_MATRIX_TOTALS_COL_WIDTH = 'w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] shrink-0';

export const PAYROLL_MATRIX_TOTALS_STICKY_CLASS = PAYROLL_MATRIX_TOTALS_COL_WIDTH;

/** Inline detail column — Due / Paid stack beside the active data column. */
export const PAYROLL_MATRIX_DETAIL_COL_WIDTH = 'w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] shrink-0';

/** Below app dialogs (z-50) so matrix cell modals stay visible in full-screen mode. */
export const PAYROLL_MATRIX_FULLSCREEN_Z = 'z-40';
