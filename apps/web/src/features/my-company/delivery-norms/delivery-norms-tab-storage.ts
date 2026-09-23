'use client';

import { createPersistedJsonStore } from '@/lib/persisted-client-state';
import {
  DELIVERY_NORMS_PROFILE_TABS,
  DELIVERY_NORMS_TABS,
  DELIVERY_NORMS_UNIT_TABS,
  type DeliveryNormsLocation,
} from './delivery-norms-workspace';

export const DELIVERY_NORMS_LOCATION_STORAGE_KEY = 'nbos:delivery-norms:location';

const DEFAULT_LOCATION: DeliveryNormsLocation = {
  tab: 'overview',
  profileTab: 'core',
  unitTab: 'core',
};

const TABS = new Set<string>(DELIVERY_NORMS_TABS);
const PROFILE_TABS = new Set<string>(DELIVERY_NORMS_PROFILE_TABS);
const UNIT_TABS = new Set<string>(DELIVERY_NORMS_UNIT_TABS);

export function parseDeliveryNormsLocation(raw: string | null): DeliveryNormsLocation {
  const record = readRecord(raw);
  if (!record) return { ...DEFAULT_LOCATION };
  return {
    tab: asMember(record.tab, TABS, DEFAULT_LOCATION.tab),
    profileTab: asMember(record.profileTab, PROFILE_TABS, DEFAULT_LOCATION.profileTab),
    unitTab: asMember(record.unitTab, UNIT_TABS, DEFAULT_LOCATION.unitTab),
  };
}

const locationStore = createPersistedJsonStore<DeliveryNormsLocation>({
  storageKey: DELIVERY_NORMS_LOCATION_STORAGE_KEY,
  defaultValue: DEFAULT_LOCATION,
  changeEvent: 'nbos:delivery-norms:location-change',
  parse: parseDeliveryNormsLocation,
});

export const useDeliveryNormsLocation = locationStore.useValue;

function readRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function asMember<T extends string>(value: unknown, allowed: ReadonlySet<string>, fallback: T): T {
  if (typeof value === 'string' && allowed.has(value)) {
    return value as T;
  }
  return fallback;
}
