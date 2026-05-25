export type BonusBoardViewMode = 'board' | 'list' | 'employee' | 'product' | 'payroll';

const STORAGE_KEY = 'nbos:finance:bonus-board-view';

export function readBonusBoardViewMode(): BonusBoardViewMode {
  if (typeof window === 'undefined') {
    return 'board';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'list' || raw === 'employee' || raw === 'product' || raw === 'payroll') {
    return raw;
  }
  return 'board';
}

export function writeBonusBoardViewMode(mode: BonusBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
