/**
 * Global page hero toolbar layout (all viewport sizes).
 * Module title is always in the app header via useHeaderModuleTitle.
 *
 * Toolbar uses flex-wrap: one row while tabs + tools fit; second row only when
 * the tools strip needs its minimum width (content-driven, not viewport breakpoints).
 */

/** Hero card narrower than this (px) — search can expand over trailing actions. */
export const PAGE_HERO_COMPACT_MAX_WIDTH_PX = 1280;

/** shrink-0 — never collapse when a tall list/grid sibling shares a flex column (e.g. Projects “All”). */
export const PAGE_HERO_SURFACE_CLIP = 'w-full min-w-0 shrink-0 overflow-hidden';

/** Let IntegratedSearchFilters dropdown escape hero clipping while open. */
export const PAGE_HERO_OVERFLOW_FILTERS_OPEN = 'overflow-visible';

export const PAGE_HERO_SURFACE_PADDING = 'px-3 py-2.5 xl:px-4 xl:py-3';

export const PAGE_HERO_TOOLBAR = [
  'flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2',
  'overflow-hidden',
].join(' ');

export const PAGE_HERO_TABS_SLOT = 'min-w-0 max-w-full shrink-0';

/** flex-basis 24rem — wraps to row 2 when tabs leave less than ~24rem for tools. */
export const PAGE_HERO_TOOLS_ROW = [
  'flex min-w-0 max-w-full flex-nowrap items-center gap-2 overflow-hidden',
  'min-w-[24rem] flex-[1_1_24rem]',
].join(' ');

export const PAGE_HERO_SEARCH_SLOT =
  'min-w-0 w-full flex-1 basis-0 transition-[flex-grow] duration-200';

export const PAGE_HERO_SEARCH_SLOT_EXPANDED = 'min-w-0 flex-1';

export const PAGE_HERO_TRAILING_SLOT = [
  'flex min-w-0 shrink flex-nowrap items-center justify-end gap-1.5',
  'overflow-hidden transition-all duration-200 ease-out',
  'xl:gap-2',
].join(' ');

export const PAGE_HERO_TRAILING_COLLAPSED = [
  'max-w-0 min-w-0 flex-none gap-0 opacity-0',
  'pointer-events-none',
].join(' ');

/** Single tab size on all viewports (Drive-style pill tabs). */
export const PAGE_HERO_TAB_BUTTON = [
  'inline-flex items-center gap-2 rounded-full px-3 py-2',
  'text-sm font-bold tracking-tight whitespace-nowrap transition-colors sm:px-3.5',
].join(' ');

export const PAGE_HERO_TAB_ICON_WRAP =
  'flex size-7 shrink-0 items-center justify-center rounded-full';

export const PAGE_HERO_TAB_ICON = 'size-4';

/** View mode icon button — labels live in aria-label / title only. */
export const PAGE_HERO_VIEW_BUTTON =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors';
