/** Expanded sidebar width — must match `AppLayout` grid column and `Sidebar` root width. */
export const SIDEBAR_WIDTH_EXPANDED_PX = 260;

/** Collapsed rail width — must match `AppLayout` grid column and `Sidebar` root width. */
export const SIDEBAR_WIDTH_COLLAPSED_PX = 56;

/** Matches `Topbar` (`h-16`) so the logo row and main header share one baseline. */
export const SIDEBAR_HEADER_HEIGHT_CLASS = 'h-16';

/** Logo + collapse control row; horizontal padding pairs with `SIDEBAR_NAV_LIST_CLASS`. */
export const SIDEBAR_HEADER_CLASS =
  'border-sidebar-border flex shrink-0 items-center border-b px-2.5 gap-2';

/** Max rendered logo width inside the sidebar header (intrinsic SVG is wider). */
export const SIDEBAR_LOGO_MAX_WIDTH_CLASS = 'max-w-[7.5rem]';

/** Nav list container padding (pairs with inset on items). */
export const SIDEBAR_NAV_LIST_CLASS = 'px-2 py-3';

/** Standard top-level nav link padding. */
export const SIDEBAR_NAV_ITEM_CLASS = 'px-2.5 py-1.5';

/** Compact footer control next to the pinned Settings row. */
export const SIDEBAR_FOOTER_CUSTOMIZE_BUTTON_CLASS =
  'text-sidebar-muted hover:bg-secondary hover:text-sidebar-foreground flex size-9 shrink-0 items-center justify-center rounded-md transition-colors';

/** Child link indent under expandable modules. */
export const SIDEBAR_NAV_CHILD_LIST_CLASS = 'mt-0.5 ml-9 space-y-0';

export const SIDEBAR_NAV_CHILD_LINK_CLASS =
  'block rounded-lg px-3 py-1.5 text-[13px] transition-colors';

/** Chevron rotate on expand/collapse affordances. */
export const SIDEBAR_CHEVRON_TRANSITION_CLASS = 'transition-transform duration-200 ease-out';

/** Nested sidebar section open/close shell (grid-rows height animation). */
export const SIDEBAR_COLLAPSE_PANEL_CLASS =
  'grid transition-[grid-template-rows] duration-200 ease-out';
export const SIDEBAR_COLLAPSE_PANEL_OPEN_CLASS = 'grid-rows-[1fr]';
export const SIDEBAR_COLLAPSE_PANEL_CLOSED_CLASS = 'grid-rows-[0fr]';
export const SIDEBAR_COLLAPSE_PANEL_INNER_CLASS = 'min-h-0 overflow-hidden';
