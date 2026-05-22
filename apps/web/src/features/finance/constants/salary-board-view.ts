export type SalaryBoardViewMode = 'calendar' | 'list' | 'board';

const STORAGE_KEY = 'nbos:finance:salary-board-view';

export function readSalaryBoardViewMode(): SalaryBoardViewMode {
  if (typeof window === 'undefined') {
    return 'calendar';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'list' || raw === 'board' || raw === 'calendar') {
    return raw;
  }
  if (raw === 'grid') {
    return 'calendar';
  }
  return 'calendar';
}

export function writeSalaryBoardViewMode(mode: SalaryBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
