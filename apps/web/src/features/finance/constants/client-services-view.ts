'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type ClientServicesViewMode = 'list' | 'status' | 'months';

const clientServicesViewStore = createPersistedScalarStore<ClientServicesViewMode>({
  storageKey: 'nbos:finance:client-services-view',
  defaultValue: 'list',
  parse: (raw) => {
    if (raw === 'status' || raw === 'months') {
      return raw;
    }
    return 'list';
  },
});

export const readClientServicesViewMode = clientServicesViewStore.read;
export const writeClientServicesViewMode = clientServicesViewStore.write;
export const useClientServicesViewMode = clientServicesViewStore.useValue;
