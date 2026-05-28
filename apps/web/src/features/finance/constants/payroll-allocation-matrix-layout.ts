/** Fixed sticky row/corner width — same in Employee × Order and Order × Employees views. */
export const PAYROLL_MATRIX_STICKY_EDGE_WIDTH =
  'w-[11.5rem] max-w-[11.5rem] min-w-[11.5rem] shrink-0';

/** Opaque sticky header tint — lighter than `--muted`, darker than `--card`. */
export const PAYROLL_MATRIX_STICKY_HEADER_BG = 'bg-[oklch(0.982_0.002_90)]';

/** Selected / expanded row or column — soft green background only; text stays default. */
export const PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG = 'bg-emerald-500/12';

/** @deprecated Use PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG for column selection. */
export const PAYROLL_MATRIX_STICKY_HEADER_ACTIVE_BG = PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG;

export const PAYROLL_MATRIX_STICKY_HEADER_SHADOW = 'shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]';

/** Scrollable matrix body — replaces outer padding wrapper in workspace. */
export const PAYROLL_MATRIX_BODY_CLASS =
  'min-h-0 flex-1 max-h-[min(70vh,48rem)] overflow-auto rounded-lg';

export const PAYROLL_MATRIX_BODY_FULLSCREEN_CLASS = 'min-h-0 flex-1 overflow-auto rounded-lg';

/** `border-collapse: collapse` breaks `position: sticky` on header cells. */
export const PAYROLL_MATRIX_TABLE_CLASS =
  'w-max min-w-full border-separate border-spacing-0 text-xs';

export const PAYROLL_MATRIX_COLUMN_HEADER_STICKY = 'sticky top-0 z-20';

export const PAYROLL_MATRIX_DATA_COL_WIDTH = 'min-w-[7.5rem]';

/** Inline detail column — Due / Paid stack beside the active data column. */
export const PAYROLL_MATRIX_DETAIL_COL_WIDTH = 'w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] shrink-0';

/** Below app dialogs (z-50) so matrix cell modals stay visible in full-screen mode. */
export const PAYROLL_MATRIX_FULLSCREEN_Z = 'z-40';
