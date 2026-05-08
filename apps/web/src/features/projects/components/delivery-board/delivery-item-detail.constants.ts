/** Legacy product status keys allowed as next move (stage-gate copy). */
export const DELIVERY_DETAIL_PRODUCT_NEXT: Record<string, string[]> = {
  NEW: ['CREATING'],
  CREATING: ['DEVELOPMENT'],
  DEVELOPMENT: ['QA'],
  QA: ['TRANSFER', 'DEVELOPMENT'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: [],
  DONE: [],
  LOST: [],
};

export const DELIVERY_DETAIL_SECONDARY_TABS = [
  { id: 'workspace' as const, label: 'Work Space' },
  { id: 'calls' as const, label: 'Calls' },
  { id: 'bonus' as const, label: 'Bonus' },
  { id: 'history' as const, label: 'History' },
];

export type DeliveryDetailSecondaryId = (typeof DELIVERY_DETAIL_SECONDARY_TABS)[number]['id'];

export type DeliveryDetailPanel = 'cockpit' | DeliveryDetailSecondaryId;
