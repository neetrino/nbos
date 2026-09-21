export const DELIVERY_NORMS_TABS = ['overview', 'rates', 'profiles', 'functions', 'sale'] as const;

export type DeliveryNormsTab = (typeof DELIVERY_NORMS_TABS)[number];

export const DELIVERY_NORMS_PROFILE_TABS = ['versions', 'core', 'collections'] as const;

export type DeliveryNormsProfileTab = (typeof DELIVERY_NORMS_PROFILE_TABS)[number];

export const DELIVERY_NORMS_MAP_KEYS = [
  'enrollment',
  'rates',
  'profiles',
  'profileUnits',
  'profileIncluded',
  'profileCore',
  'profileCollections',
  'functions',
  'sale',
] as const;

export type DeliveryNormsMapKey = (typeof DELIVERY_NORMS_MAP_KEYS)[number];

export type DeliveryNormsLocation = {
  tab: DeliveryNormsTab;
  profileTab: DeliveryNormsProfileTab;
};

export const DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID = 'delivery-norms-enrollment';

const DEFAULT_PROFILE_TAB: DeliveryNormsProfileTab = 'versions';

const MAP_LOCATION: Record<DeliveryNormsMapKey, DeliveryNormsLocation> = {
  enrollment: { tab: 'overview', profileTab: DEFAULT_PROFILE_TAB },
  rates: { tab: 'rates', profileTab: DEFAULT_PROFILE_TAB },
  profiles: { tab: 'profiles', profileTab: DEFAULT_PROFILE_TAB },
  profileUnits: { tab: 'profiles', profileTab: DEFAULT_PROFILE_TAB },
  profileIncluded: { tab: 'profiles', profileTab: DEFAULT_PROFILE_TAB },
  profileCore: { tab: 'profiles', profileTab: 'core' },
  profileCollections: { tab: 'profiles', profileTab: 'collections' },
  functions: { tab: 'functions', profileTab: DEFAULT_PROFILE_TAB },
  sale: { tab: 'sale', profileTab: DEFAULT_PROFILE_TAB },
};

export function locationForMapKey(key: DeliveryNormsMapKey): DeliveryNormsLocation {
  return MAP_LOCATION[key];
}

export function countPublished(rows: ReadonlyArray<{ status: string }>): number {
  return rows.filter((row) => row.status === 'PUBLISHED').length;
}
