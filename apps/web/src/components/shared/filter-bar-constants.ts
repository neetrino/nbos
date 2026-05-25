/** Soft panel behind search + filters (list / directory toolbars). */
export const FILTER_BAR_TOOLBAR_SURFACE =
  'rounded-2xl bg-muted/80 p-2.5 sm:p-3 ring-1 ring-border/40 shadow-sm shadow-black/[0.03]';

/** Inner row spacing inside the toolbar surface. */
export const FILTER_BAR_INNER_GAP = 'flex flex-wrap items-center gap-2.5 sm:gap-3';

/**
 * Fixed slot between search and filter selects so the global clear control
 * does not shift the rest of the row when it becomes visible.
 */
export const FILTER_BAR_GLOBAL_CLEAR_SLOT = 'flex size-10 shrink-0 items-center justify-center';

/**
 * Global clear (between search and filters): strong enough to notice when the
 * list is narrowed so users do not miss items behind an active filter/search.
 */
export const FILTER_BAR_GLOBAL_CLEAR_BUTTON_TONE =
  'text-blue-700 bg-blue-600/14 ring-1 ring-blue-600/40 shadow-sm shadow-blue-600/10 ' +
  'hover:bg-blue-600/22 hover:text-blue-800 hover:ring-blue-600/55 ' +
  'dark:text-blue-200 dark:bg-blue-500/18 dark:ring-blue-400/45 ' +
  'dark:hover:bg-blue-500/26 dark:hover:text-white dark:hover:ring-blue-400/60';

/** Search field when query text is active (same family as filter-active). */
export const FILTER_BAR_SEARCH_ACTIVE =
  'ring-2 ring-blue-600/35 ring-offset-2 ring-offset-muted bg-blue-600/[0.07] ' +
  'dark:ring-blue-400/40 dark:bg-blue-500/12';

/** Filter select when a narrowing value is chosen (not “All …”). */
export const FILTER_BAR_FILTER_TRIGGER_ACTIVE =
  'ring-2 ring-blue-600/40 ring-offset-2 ring-offset-muted bg-blue-600/[0.08] text-blue-950 ' +
  'dark:ring-blue-400/45 dark:bg-blue-500/14 dark:text-blue-50';

/**
 * Pill control on the toolbar: full height, no border, light elevation.
 */
export const FILTER_BAR_CONTROL_PILL =
  'h-10 min-h-10 rounded-full border-0 bg-background text-sm shadow-sm shadow-black/[0.06] ' +
  'transition-[box-shadow,background-color] ' +
  'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-muted';
