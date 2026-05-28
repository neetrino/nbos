/** Fixed sticky row/corner width — same in Employee × Order and Order × Employees views. */
export const PAYROLL_MATRIX_STICKY_EDGE_WIDTH =
  'w-[11.5rem] max-w-[11.5rem] min-w-[11.5rem] shrink-0';

/** Opaque sticky header tint — lighter than `--muted`, darker than `--card`. */
export const PAYROLL_MATRIX_STICKY_HEADER_BG = 'bg-[oklch(0.982_0.002_90)]';

export const PAYROLL_MATRIX_STICKY_HEADER_ACTIVE_BG = 'bg-[oklch(0.965_0.003_90)]';

export const PAYROLL_MATRIX_STICKY_HEADER_SHADOW = 'shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]';

/** Scrollable matrix body — replaces outer padding wrapper in workspace. */
export const PAYROLL_MATRIX_BODY_CLASS =
  'min-h-0 flex-1 max-h-[min(70vh,48rem)] overflow-auto rounded-lg';
