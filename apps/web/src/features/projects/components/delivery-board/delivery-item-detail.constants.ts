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
 * General tab desktop columns (left · Delivery plan · Access).
 * fr weights: 0.75 · 1 · 1
 */
export const DELIVERY_DETAIL_GENERAL_TAB_GRID_CLASS =
  'grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-5';

/** Column stack — cards fill track width so column edges stay aligned. */
export const DELIVERY_DETAIL_GENERAL_COLUMN_CLASS = 'flex min-w-0 w-full flex-col gap-4';
