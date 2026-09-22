import {
  CODE_COMMERCE_PRODUCT_TYPES,
  CODE_OPERATIONS_PRODUCT_TYPES,
  CODE_PORTAL_PRODUCT_TYPES,
  CODE_SITE_PRODUCT_TYPES,
  MARKETING_PRODUCT_TYPES,
} from '@nbos/shared';

export const CORE_RAIL_ALL_ID = 'all' as const;

export const CORE_KIND_GROUP_IDS = [
  'sites',
  'commerce',
  'operations',
  'portals',
  'marketing',
  'other',
] as const;

export type CoreKindGroupId = (typeof CORE_KIND_GROUP_IDS)[number];

export type CoreRailId = typeof CORE_RAIL_ALL_ID | CoreKindGroupId;

const OTHER_PRODUCT_TYPE = 'OTHER';

const GROUP_TYPES: Record<CoreKindGroupId, readonly string[]> = {
  sites: CODE_SITE_PRODUCT_TYPES,
  commerce: CODE_COMMERCE_PRODUCT_TYPES,
  operations: CODE_OPERATIONS_PRODUCT_TYPES,
  portals: CODE_PORTAL_PRODUCT_TYPES,
  marketing: MARKETING_PRODUCT_TYPES,
  other: [OTHER_PRODUCT_TYPE],
};

export type CoreRailEntry = {
  id: CoreRailId;
  count: number;
};

/** Kind families that do not overlap. One product type belongs to one family. */
export function coreKindGroupId(productType: string): CoreKindGroupId {
  for (const id of CORE_KIND_GROUP_IDS) {
    if (GROUP_TYPES[id].includes(productType)) return id;
  }
  return 'other';
}

export function buildCoreRailEntries(productTypes: readonly string[]): CoreRailEntry[] {
  const counts = new Map<CoreKindGroupId, number>();
  for (const productType of productTypes) {
    const id = coreKindGroupId(productType);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [
    { id: CORE_RAIL_ALL_ID, count: productTypes.length },
    ...CORE_KIND_GROUP_IDS.map((id) => ({ id, count: counts.get(id) ?? 0 })),
  ];
}

export function visibleCoreGroupIds(
  productTypes: readonly string[],
  selected: CoreRailId,
): CoreKindGroupId[] {
  if (selected !== CORE_RAIL_ALL_ID) {
    return productTypes.some((type) => coreKindGroupId(type) === selected) ? [selected] : [];
  }
  return CORE_KIND_GROUP_IDS.filter((id) =>
    productTypes.some((type) => coreKindGroupId(type) === id),
  );
}

export function isCoreRailId(value: string): value is CoreRailId {
  return value === CORE_RAIL_ALL_ID || (CORE_KIND_GROUP_IDS as readonly string[]).includes(value);
}
