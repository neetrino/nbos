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
 * Narrower than Deal 75vw — three equal General columns fill the panel
 * at the former Team card width (no empty trailing track).
 */
export const DELIVERY_DETAIL_SHEET_CONTENT_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[58vw]';

/** Floating rail seam for {@link DELIVERY_DETAIL_SHEET_CONTENT_CLASS}. */
export const DELIVERY_DETAIL_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[58vw]';

/**
 * General tab desktop columns — cards keep natural height (not stretched equal).
 */
export const DELIVERY_DETAIL_GENERAL_TAB_GRID_CLASS =
  'grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start xl:gap-5';

/** Column stack — cards fill track width so column edges stay aligned. */
export const DELIVERY_DETAIL_GENERAL_COLUMN_CLASS = 'flex min-w-0 w-full flex-col gap-4';
