export const DELIVERY_NORMS_TABS = ['overview', 'rates', 'units', 'profiles', 'sale'] as const;

export type DeliveryNormsTab = (typeof DELIVERY_NORMS_TABS)[number];

export const DELIVERY_NORMS_PROFILE_TABS = ['core', 'collections'] as const;

export type DeliveryNormsProfileTab = (typeof DELIVERY_NORMS_PROFILE_TABS)[number];

export const DELIVERY_NORMS_UNIT_TABS = ['core', 'function'] as const;

export type DeliveryNormsUnitTab = (typeof DELIVERY_NORMS_UNIT_TABS)[number];

export const DELIVERY_NORMS_MAP_KEYS = [
  'enrollment',
  'rates',
  'units',
  'unitCore',
  'unitFunction',
  'profiles',
  'profileCore',
  'profileCollections',
  'sale',
] as const;

export type DeliveryNormsMapKey = (typeof DELIVERY_NORMS_MAP_KEYS)[number];

export type DeliveryNormsLocation = {
  tab: DeliveryNormsTab;
  profileTab: DeliveryNormsProfileTab;
  unitTab: DeliveryNormsUnitTab;
};

export const DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID = 'delivery-norms-enrollment';

const IDLE: Pick<DeliveryNormsLocation, 'profileTab' | 'unitTab'> = {
  profileTab: 'core',
  unitTab: 'core',
};

const MAP_LOCATION: Record<DeliveryNormsMapKey, DeliveryNormsLocation> = {
  enrollment: { tab: 'overview', ...IDLE },
  rates: { tab: 'rates', ...IDLE },
  units: { tab: 'units', ...IDLE },
  unitCore: { tab: 'units', profileTab: 'core', unitTab: 'core' },
  unitFunction: { tab: 'units', profileTab: 'core', unitTab: 'function' },
  profiles: { tab: 'profiles', ...IDLE },
  profileCore: { tab: 'profiles', profileTab: 'core', unitTab: 'core' },
  profileCollections: { tab: 'profiles', profileTab: 'collections', unitTab: 'core' },
  sale: { tab: 'sale', ...IDLE },
};

export function locationForMapKey(key: DeliveryNormsMapKey): DeliveryNormsLocation {
  return MAP_LOCATION[key];
}

export function countPublished(rows: ReadonlyArray<{ status: string }>): number {
  return rows.filter((row) => row.status === 'PUBLISHED').length;
}
