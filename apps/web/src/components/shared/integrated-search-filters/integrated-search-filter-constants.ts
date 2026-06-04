/**
 * Integrated search filter dropdown — fixed width, decoupled from the hero search flex slot.
 * Two-column field grid; width clamps on very narrow viewports only.
 */

/** Standard panel width (two filter columns). */
export const INTEGRATED_SEARCH_FILTER_PANEL_WIDTH_CLASS = 'w-[40rem]';

/** Minimum width before the panel clamps to the viewport edge. */
export const INTEGRATED_SEARCH_FILTER_PANEL_MIN_WIDTH_CLASS = 'min-w-[24rem]';

/** Prevent horizontal overflow on small screens without tying width to the search input. */
export const INTEGRATED_SEARCH_FILTER_PANEL_MAX_WIDTH_CLASS = 'max-w-[min(40rem,calc(100vw-2rem))]';

export const INTEGRATED_SEARCH_FILTER_PANEL_POSITION = [
  'absolute top-[calc(100%+0.5rem)] left-0 z-50',
  INTEGRATED_SEARCH_FILTER_PANEL_WIDTH_CLASS,
  INTEGRATED_SEARCH_FILTER_PANEL_MIN_WIDTH_CLASS,
  INTEGRATED_SEARCH_FILTER_PANEL_MAX_WIDTH_CLASS,
].join(' ');

export const INTEGRATED_SEARCH_FILTER_PANEL_SURFACE = [
  'bg-popover/95 text-popover-foreground border-border/60',
  'ring-border/40 rounded-xl border p-4 shadow-xl ring-1',
].join(' ');

/** Always two columns inside the fixed-width panel. */
export const INTEGRATED_SEARCH_FILTER_PANEL_GRID = 'grid grid-cols-2 gap-x-3 gap-y-3';
