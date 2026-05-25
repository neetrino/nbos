'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ExpensePlansViewMode = 'grid' | 'board' | 'list';

const STORAGE_KEY = 'nbos:finance:expense-plans-view';
const VIEW_MODE_CHANGE_EVENT = 'nbos:expense-plans-view-change';

export const DEFAULT_EXPENSE_PLANS_VIEW_MODE: ExpensePlansViewMode = 'grid';

export const EXPENSE_PLANS_VIEW_OPTIONS = [
  { value: 'grid' as const, label: 'Grid' },
  { value: 'board' as const, label: 'Board' },
  { value: 'list' as const, label: 'List' },
];

function parseStoredViewMode(raw: string | null): ExpensePlansViewMode {
  if (raw === 'list') return 'list';
  if (raw === 'board') return 'board';
  return DEFAULT_EXPENSE_PLANS_VIEW_MODE;
}

export function readExpensePlansViewMode(): ExpensePlansViewMode {
  if (typeof window === 'undefined') {
    return DEFAULT_EXPENSE_PLANS_VIEW_MODE;
  }
  return parseStoredViewMode(window.localStorage.getItem(STORAGE_KEY));
}

export function writeExpensePlansViewMode(mode: ExpensePlansViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event(VIEW_MODE_CHANGE_EVENT));
}

function subscribeExpensePlansViewMode(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener('storage', onChange);
  window.addEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
  };
}

function getExpensePlansViewModeServerSnapshot(): ExpensePlansViewMode {
  return DEFAULT_EXPENSE_PLANS_VIEW_MODE;
}

/** SSR-safe view mode synced with localStorage after hydration. */
export function useExpensePlansViewMode(): [
  ExpensePlansViewMode,
  (mode: ExpensePlansViewMode) => void,
] {
  const view = useSyncExternalStore(
    subscribeExpensePlansViewMode,
    readExpensePlansViewMode,
    getExpensePlansViewModeServerSnapshot,
  );

  const setView = useCallback((mode: ExpensePlansViewMode) => {
    writeExpensePlansViewMode(mode);
  }, []);

  return [view, setView];
}
