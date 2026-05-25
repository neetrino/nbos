export type BonusPoolsViewMode = 'list' | 'board';

const STORAGE_KEY = 'nbos:finance:bonus-pools-view';

export function readBonusPoolsViewMode(): BonusPoolsViewMode {
  if (typeof window === 'undefined') {
    return 'list';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'board') {
    return 'board';
  }
  return 'list';
}

export function writeBonusPoolsViewMode(mode: BonusPoolsViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
