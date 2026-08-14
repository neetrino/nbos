import { cn } from '@/lib/utils';

/** Sticky-note paper — pale cream in light, richer yellow in dark. */
export const DASHBOARD_NOTE_SURFACE_CLASS = 'bg-amber-50 dark:bg-amber-200';

/** Composer surfaces with slight transparency. */
export const DASHBOARD_NOTE_SURFACE_COMPOSER_CLASS = 'bg-amber-50/90 dark:bg-amber-200/90';

export const DASHBOARD_NOTE_SURFACE_COMPOSER_HEADER_CLASS = 'bg-amber-50/95 dark:bg-amber-200/95';

export const DASHBOARD_NOTE_BORDER_CLASS = 'border-amber-200 dark:border-amber-400/70';

export const DASHBOARD_NOTE_INK_CLASS = 'text-amber-950';

export const DASHBOARD_NOTE_MUTED_INK_CLASS = 'text-amber-900/45';

export const DASHBOARD_NOTE_PLACEHOLDER_CLASS = 'placeholder:text-amber-900/40';

export const DASHBOARD_NOTE_HINT_CLASS = 'text-amber-900/50';

/** Corner controls on cream cards (composer + saved notes). */
export const DASHBOARD_NOTE_CORNER_PILL_CLASS = cn(
  'h-7 rounded-full border px-2.5 text-xs font-medium shadow-sm backdrop-blur',
  DASHBOARD_NOTE_BORDER_CLASS,
  DASHBOARD_NOTE_SURFACE_COMPOSER_CLASS,
  'text-amber-900/75 hover:bg-amber-100/90 dark:hover:bg-amber-300/90',
);

export const DASHBOARD_NOTE_CORNER_SAVE_PRIMARY_CLASS = cn(
  DASHBOARD_NOTE_CORNER_PILL_CLASS,
  'border-amber-800/30 bg-amber-900 text-amber-50 hover:bg-amber-800',
  'disabled:border-amber-200 disabled:bg-amber-50/90 disabled:text-amber-900/30',
  'dark:disabled:border-amber-400/70 dark:disabled:bg-amber-200/90 dark:disabled:text-amber-950/30',
);

export const DASHBOARD_NOTE_DELETE_BUTTON_CLASS = cn(
  'h-7 w-7 rounded-full border shadow-sm backdrop-blur hover:text-red-700',
  DASHBOARD_NOTE_BORDER_CLASS,
  DASHBOARD_NOTE_SURFACE_COMPOSER_CLASS,
  DASHBOARD_NOTE_MUTED_INK_CLASS,
);

export const DASHBOARD_NOTE_COMPOSER_BOX_CLASS = cn(
  'relative overflow-hidden rounded-2xl border shadow-inner',
  DASHBOARD_NOTE_BORDER_CLASS,
  DASHBOARD_NOTE_SURFACE_COMPOSER_CLASS,
);

export const DASHBOARD_NOTE_COMPOSER_HEADER_CLASS = cn(
  'absolute top-0 right-0 overflow-hidden rounded-2xl border shadow-sm transition-[width,box-shadow] duration-200 ease-out',
  DASHBOARD_NOTE_BORDER_CLASS,
  DASHBOARD_NOTE_SURFACE_COMPOSER_HEADER_CLASS,
);

export const DASHBOARD_NOTE_EXPANDED_RING_CLASS =
  'shadow-lg ring-1 ring-amber-200/80 dark:ring-amber-400/50';

export const DASHBOARD_NOTE_CARD_CLASS = cn(
  'relative rounded-xl border px-3 pt-3 pb-7 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md',
  DASHBOARD_NOTE_BORDER_CLASS,
  DASHBOARD_NOTE_SURFACE_CLASS,
);

export const DASHBOARD_NOTE_DRAG_PREVIEW_CLASS = cn(
  'max-w-sm rounded-xl border border-amber-300 px-3 py-3 opacity-95 shadow-2xl ring-2 ring-amber-300/45',
  'dark:border-amber-400 dark:bg-amber-200 dark:ring-amber-400/45',
  'bg-amber-50',
);
