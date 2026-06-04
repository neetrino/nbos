'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type ExpensesBoardViewMode = 'kanban' | 'list';

const expensesBoardViewStore = createPersistedScalarStore<ExpensesBoardViewMode>({
  storageKey: 'nbos:finance:expenses-board-view',
  defaultValue: 'kanban',
  parse: (raw) => (raw === 'list' ? 'list' : 'kanban'),
});

/** NBOS Expense Board default: kanban (`04-Finance-Pages` §4.2). */
export const readExpensesBoardViewMode = expensesBoardViewStore.read;
export const writeExpensesBoardViewMode = expensesBoardViewStore.write;
export const useExpensesBoardViewMode = expensesBoardViewStore.useValue;
