export type ExpensesBoardViewMode = 'kanban' | 'list';

const STORAGE_KEY = 'nbos:finance:expenses-board-view';

/** NBOS Expense Board default: kanban (`04-Finance-Pages` §4.2). */
export function readExpensesBoardViewMode(): ExpensesBoardViewMode {
  if (typeof window === 'undefined') {
    return 'kanban';
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'list' ? 'list' : 'kanban';
}

export function writeExpensesBoardViewMode(mode: ExpensesBoardViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
}
