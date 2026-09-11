/** Bottom-sheet app launcher — slides up, two large tiles per row. */
export const MOBILE_APP_MENU_SHEET_CLASS = [
  'gap-0 border-x-0 p-0 shadow-xl',
  'data-[side=bottom]:max-h-[min(88dvh,calc(100dvh-0.5rem))]',
  'data-[side=bottom]:rounded-t-3xl data-[side=bottom]:border-t',
].join(' ');

export const MOBILE_APP_MENU_HANDLE_CLASS = 'bg-border h-1 w-10 rounded-full';

export const MOBILE_APP_MENU_HANDLE_HIT_CLASS =
  'flex cursor-grab touch-none items-center justify-center pt-3.5 pb-1 active:cursor-grabbing';

export const MOBILE_APP_MENU_GRID_CLASS = 'grid grid-cols-2 gap-2.5';

export const MOBILE_APP_MENU_TILE_CLASS = [
  'nbos-pressable relative flex min-h-[4.75rem] flex-col items-start justify-between gap-3 overflow-hidden',
  'rounded-2xl border border-border/80 bg-card px-3.5 py-3 text-left',
  'text-foreground',
].join(' ');

export const MOBILE_APP_MENU_TILE_ACTIVE_CLASS = 'border-primary/20 bg-sidebar-accent';

export function isMobileAppMenuItemActive(
  pathname: string,
  href: string,
  entryHref: string,
): boolean {
  return pathname === entryHref || pathname === href || pathname.startsWith(`${href}/`);
}
