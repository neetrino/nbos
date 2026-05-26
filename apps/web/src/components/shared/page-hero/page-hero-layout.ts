/**
 * Global page hero toolbar layout (all viewport sizes).
 * Module title is always in the app header via useHeaderModuleTitle.
 */

/** Hero toolbar narrower than this (px) — search can expand over trailing actions. */
export const PAGE_HERO_COMPACT_MAX_WIDTH_PX = 1280;

export const PAGE_HERO_SURFACE_CLIP = 'w-full min-w-0 overflow-hidden';

export const PAGE_HERO_SURFACE_PADDING = 'px-3 py-2.5 xl:px-4 xl:py-3';

export const PAGE_HERO_TOOLBAR = [
  'flex min-w-0 flex-col gap-2 overflow-hidden',
  'lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2.5',
  'xl:gap-3',
].join(' ');

export const PAGE_HERO_TABS_SLOT = [
  'min-w-0 max-w-full shrink-0',
  'lg:max-w-[min(100%,26rem)]',
].join(' ');

export const PAGE_HERO_TOOLS_ROW = [
  'flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-hidden',
  'lg:min-w-0 lg:flex-1 lg:basis-0',
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

/** Single tab size on all viewports. */
export const PAGE_HERO_TAB_BUTTON = [
  'inline-flex items-center gap-1.5 rounded-full px-2 py-1.5',
  'text-xs font-bold tracking-tight whitespace-nowrap transition-colors',
].join(' ');

export const PAGE_HERO_TAB_ICON_WRAP =
  'flex size-6 shrink-0 items-center justify-center rounded-full';

export const PAGE_HERO_TAB_ICON = 'size-3.5';

/** View mode icon button — labels live in aria-label / title only. */
export const PAGE_HERO_VIEW_BUTTON =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors';
