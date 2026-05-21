export type ExpensePlansViewMode = 'grid' | 'board' | 'list';

const STORAGE_KEY = 'nbos:finance:expense-plans-view';

export const EXPENSE_PLANS_VIEW_OPTIONS = [
  { value: 'grid' as const, label: 'Grid' },
  { value: 'board' as const, label: 'Board' },
  { value: 'list' as const, label: 'List' },
];

export function readExpensePlansViewMode(): ExpensePlansViewMode {
  if (typeof window === 'undefined') {
    return 'grid';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'list') return 'list';
  if (raw === 'board') return 'board';
  return 'grid';
}

export function writeExpensePlansViewMode(mode: ExpensePlansViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
