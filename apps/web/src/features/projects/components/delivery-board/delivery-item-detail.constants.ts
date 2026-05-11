export const DELIVERY_DETAIL_TABS = [
  { id: 'general' as const, label: 'General' },
  { id: 'calls' as const, label: 'Calls' },
  { id: 'bonus' as const, label: 'Bonus' },
  { id: 'history' as const, label: 'History' },
] as const;

export type DeliveryDetailTabId = (typeof DELIVERY_DETAIL_TABS)[number]['id'];

/** Tabs rendered in the secondary panel (excludes General). */
export type DeliveryDetailSecondaryId = Exclude<DeliveryDetailTabId, 'general'>;
