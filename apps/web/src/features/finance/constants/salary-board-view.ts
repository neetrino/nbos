export type SalaryBoardViewMode = 'grid' | 'cards' | 'list' | 'board';

const STORAGE_KEY = 'nbos:finance:salary-board-view';

export function readSalaryBoardViewMode(): SalaryBoardViewMode {
  if (typeof window === 'undefined') {
    return 'grid';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'cards' || raw === 'list' || raw === 'board') {
    return raw;
  }
  return 'grid';
}

export function writeSalaryBoardViewMode(mode: SalaryBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
