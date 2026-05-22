export type PayrollRunsListViewMode = 'list' | 'cards' | 'calendar';

const STORAGE_KEY = 'nbos:finance:payroll-runs-list-view';

export function readPayrollRunsListViewMode(): PayrollRunsListViewMode {
  if (typeof window === 'undefined') {
    return 'list';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'cards' || raw === 'calendar') {
    return raw;
  }
  return 'list';
}

export function writePayrollRunsListViewMode(mode: PayrollRunsListViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
