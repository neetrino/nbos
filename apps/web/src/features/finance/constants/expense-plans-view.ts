'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

export type ExpensePlansViewMode = 'grid' | 'board' | 'list';

export const DEFAULT_EXPENSE_PLANS_VIEW_MODE: ExpensePlansViewMode = 'grid';

export const EXPENSE_PLANS_VIEW_OPTIONS = [
  { value: 'grid' as const, label: 'Grid' },
  { value: 'board' as const, label: 'Board' },
  { value: 'list' as const, label: 'List' },
];

const expensePlansViewStore = createPersistedScalarStore<ExpensePlansViewMode>({
  storageKey: 'nbos:finance:expense-plans-view',
  defaultValue: DEFAULT_EXPENSE_PLANS_VIEW_MODE,
  changeEvent: 'nbos:expense-plans-view-change',
  parse: (raw) => {
    if (raw === 'list') return 'list';
    if (raw === 'board') return 'board';
    return DEFAULT_EXPENSE_PLANS_VIEW_MODE;
  },
});

export const readExpensePlansViewMode = expensePlansViewStore.read;
export const writeExpensePlansViewMode = expensePlansViewStore.write;
export const useExpensePlansViewMode = expensePlansViewStore.useValue;
