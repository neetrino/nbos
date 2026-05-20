export type ExpensePlansViewMode = 'grid' | 'list';

const STORAGE_KEY = 'nbos:finance:expense-plans-view';

export const EXPENSE_PLANS_VIEW_OPTIONS = [
  { value: 'grid' as const, label: 'Grid' },
  { value: 'list' as const, label: 'List' },
];

export function readExpensePlansViewMode(): ExpensePlansViewMode {
  if (typeof window === 'undefined') {
    return 'grid';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'list' ? 'list' : 'grid';
}

export function writeExpensePlansViewMode(mode: ExpensePlansViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
