/** Soft panel behind search + filters (list / directory toolbars). */
export const FILTER_BAR_TOOLBAR_SURFACE =
  'rounded-2xl bg-card/80 p-2.5 sm:p-3 ring-1 ring-border/50 shadow-[var(--shadow-panel)]';

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
  'text-primary bg-primary/12 ring-1 ring-primary/35 shadow-sm ' +
  'hover:bg-primary/18 hover:text-primary hover:ring-primary/50 ' +
  'dark:text-primary-foreground/90 dark:bg-primary/25 dark:ring-primary/40';

/** Search field when query text is active (same family as filter-active). */
export const FILTER_BAR_SEARCH_ACTIVE =
  'ring-2 ring-primary/35 ring-offset-2 ring-offset-background bg-primary/[0.07]';

/** Filter select when a narrowing value is chosen (not “All …”). */
export const FILTER_BAR_FILTER_TRIGGER_ACTIVE =
  'ring-2 ring-primary/40 ring-offset-2 ring-offset-background bg-primary/[0.08] text-foreground';

/**
 * Pill control on the toolbar: full height, no border, light elevation.
 */
export const FILTER_BAR_CONTROL_PILL =
  'h-10 min-h-10 rounded-full border-0 bg-background text-sm shadow-sm shadow-black/[0.06] ' +
  'transition-[box-shadow,background-color] ' +
  'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-muted';
