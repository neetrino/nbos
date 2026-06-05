'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type UnitEconomicsBoardViewMode =
  | 'tree'
  | 'orders'
  | 'cards'
  | 'cash'
  | 'outflows'
  | 'profitability';

const VALID_MODES: UnitEconomicsBoardViewMode[] = [
  'tree',
  'orders',
  'cards',
  'cash',
  'outflows',
  'profitability',
];

function normalizeStoredMode(raw: string | null): UnitEconomicsBoardViewMode {
  if (raw === 'list' || raw === 'projects' || raw === 'products') {
    return 'tree';
  }
  if (raw && VALID_MODES.includes(raw as UnitEconomicsBoardViewMode)) {
    return raw as UnitEconomicsBoardViewMode;
  }
  return 'tree';
}

const unitEconomicsBoardViewStore = createPersistedScalarStore<UnitEconomicsBoardViewMode>({
  storageKey: 'nbos:finance:unit-economics-view',
  defaultValue: 'tree',
  parse: normalizeStoredMode,
});

export const readUnitEconomicsBoardViewMode = unitEconomicsBoardViewStore.read;
export const writeUnitEconomicsBoardViewMode = unitEconomicsBoardViewStore.write;
export const useUnitEconomicsBoardViewMode = unitEconomicsBoardViewStore.useValue;
