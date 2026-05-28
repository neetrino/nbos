export type UnitEconomicsBoardViewMode =
  | 'list'
  | 'cards'
  | 'projects'
  | 'products'
  | 'cash'
  | 'outflows'
  | 'profitability';

const STORAGE_KEY = 'nbos:finance:unit-economics-view';

const VALID_MODES: UnitEconomicsBoardViewMode[] = [
  'list',
  'cards',
  'projects',
  'products',
  'cash',
  'outflows',
  'profitability',
];

export function readUnitEconomicsBoardViewMode(): UnitEconomicsBoardViewMode {
  if (typeof window === 'undefined') {
    return 'list';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && VALID_MODES.includes(raw as UnitEconomicsBoardViewMode)) {
    return raw as UnitEconomicsBoardViewMode;
  }
  return 'list';
}

export function writeUnitEconomicsBoardViewMode(mode: UnitEconomicsBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
