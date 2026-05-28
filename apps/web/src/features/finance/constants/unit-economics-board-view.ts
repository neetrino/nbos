export type UnitEconomicsBoardViewMode =
  | 'tree'
  | 'orders'
  | 'cards'
  | 'cash'
  | 'outflows'
  | 'profitability';

const STORAGE_KEY = 'nbos:finance:unit-economics-view';

const VALID_MODES: UnitEconomicsBoardViewMode[] = [
  'tree',
  'orders',
  'cards',
  'cash',
  'outflows',
  'profitability',
];

function normalizeStoredMode(raw: string | null): UnitEconomicsBoardViewMode {
  if (raw === 'list' || raw === 'projects' || raw === 'products') return 'tree';
  if (raw && VALID_MODES.includes(raw as UnitEconomicsBoardViewMode)) {
    return raw as UnitEconomicsBoardViewMode;
  }
  return 'tree';
}

export function readUnitEconomicsBoardViewMode(): UnitEconomicsBoardViewMode {
  if (typeof window === 'undefined') {
    return 'tree';
  }
  return normalizeStoredMode(window.localStorage.getItem(STORAGE_KEY));
}

export function writeUnitEconomicsBoardViewMode(mode: UnitEconomicsBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
