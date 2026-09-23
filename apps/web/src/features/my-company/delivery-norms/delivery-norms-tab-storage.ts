'use client';

import { createPersistedJsonStore } from '@/lib/persisted-client-state';
import { resolveDeliveryNormsSection, type DeliveryNormsSection } from './delivery-norms-workspace';

export const DELIVERY_NORMS_LOCATION_STORAGE_KEY = 'nbos:delivery-norms:location';

export type DeliveryNormsLocation = {
  section: DeliveryNormsSection;
};

const DEFAULT_LOCATION: DeliveryNormsLocation = { section: 'core' };

export function parseDeliveryNormsLocation(raw: string | null): DeliveryNormsLocation {
  return {
    section: resolveDeliveryNormsSection({
      query: null,
      stored: readRecord(raw),
      canSeeRules: true,
    }),
  };
}

const locationStore = createPersistedJsonStore<DeliveryNormsLocation>({
  storageKey: DELIVERY_NORMS_LOCATION_STORAGE_KEY,
  defaultValue: DEFAULT_LOCATION,
  changeEvent: 'nbos:delivery-norms:location-change',
  parse: parseDeliveryNormsLocation,
});

export const useDeliveryNormsStoredLocation = locationStore.useValue;

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
