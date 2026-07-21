/** Expanded sidebar width — must match `AppLayout` grid column and `Sidebar` root width. */
export const SIDEBAR_WIDTH_EXPANDED_PX = 260;

/** Collapsed rail width — must match `AppLayout` grid column and `Sidebar` root width. */
export const SIDEBAR_WIDTH_COLLAPSED_PX = 56;

/**
 * Mobile nav drawer — half viewport width, flush top/bottom.
 * Uses `data-[side=left]:*` so overrides beat default Sheet left-edge insets/rounding.
 */
export const SIDEBAR_MOBILE_SHEET_CLASS =
  'bg-sidebar border-sidebar-border data-[side=left]:top-0 data-[side=left]:right-auto data-[side=left]:bottom-0 data-[side=left]:left-0 data-[side=left]:h-dvh data-[side=left]:max-h-dvh data-[side=left]:w-1/2 data-[side=left]:max-w-none data-[side=left]:rounded-none gap-0 border-r p-0 shadow-xl';

/** Matches `Topbar` (`h-16`) so the logo row and main header share one baseline. */
export const SIDEBAR_HEADER_HEIGHT_CLASS = 'h-16';

/** Logo + collapse control row; horizontal padding pairs with `SIDEBAR_NAV_LIST_CLASS`. */
export const SIDEBAR_HEADER_CLASS =
  'border-sidebar-border flex shrink-0 items-center border-b px-2 gap-2';

/** Max rendered logo width inside the sidebar header (intrinsic SVG is wider). */
export const SIDEBAR_LOGO_MAX_WIDTH_CLASS = 'max-w-[7.5rem]';

/** Nav list container padding (pairs with inset on items). */
export const SIDEBAR_NAV_LIST_CLASS = 'px-2 py-2';

/** Standard top-level nav link padding. */
export const SIDEBAR_NAV_ITEM_CLASS = 'px-2 py-1';

/** Child link indent under expandable modules. */
export const SIDEBAR_NAV_CHILD_LIST_CLASS = 'mt-0.5 ml-9 space-y-0';

export const SIDEBAR_NAV_CHILD_LINK_CLASS =
  'block rounded-md px-3 py-1 text-[13px] transition-colors';
