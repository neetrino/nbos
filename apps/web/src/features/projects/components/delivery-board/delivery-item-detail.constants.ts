export const DELIVERY_DETAIL_TABS = [
  { id: 'general' as const, label: 'General' },
  { id: 'workspace' as const, label: 'Work Space' },
  { id: 'calls' as const, label: 'Calls' },
  { id: 'bonus' as const, label: 'Bonus' },
  { id: 'history' as const, label: 'History' },
] as const;

export type DeliveryDetailTabId = (typeof DELIVERY_DETAIL_TABS)[number]['id'];

/** Tabs rendered in the secondary panel (excludes General). */
export type DeliveryDetailSecondaryId = Exclude<DeliveryDetailTabId, 'general'>;

/**
 * Narrower than Deal 75vw — left stack + commercial/readiness column.
 */
export const DELIVERY_DETAIL_SHEET_CONTENT_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[51vw]';

/** Floating rail seam for {@link DELIVERY_DETAIL_SHEET_CONTENT_CLASS}. */
export const DELIVERY_DETAIL_SHEET_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[51vw]';

/**
 * General tab: wider left (planning, access, team) + narrow Client & order column.
 */
export const DELIVERY_DETAIL_GENERAL_TAB_GRID_CLASS =
  'grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,13.5rem)] xl:items-start xl:gap-4';

/** Column stack — cards fill track width so column edges stay aligned. */
export const DELIVERY_DETAIL_GENERAL_COLUMN_CLASS = 'flex min-w-0 w-full flex-col gap-4';
