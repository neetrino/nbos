import type { ExpenseListSortField } from '@/lib/api/finance';
import { setExpenseListSortParams } from './expenses-list-query';

/** Must match `GET /expenses?projectId=` (ExpensesController). */
export const PROJECT_EXPENSES_DRILLDOWN_QUERY = 'projectId' as const;

export interface ExpenseListNavigationSort {
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
}

export function projectExpensesDrilldownHref(projectId: string): string {
  const q = new URLSearchParams({
    [PROJECT_EXPENSES_DRILLDOWN_QUERY]: projectId,
  });
  return `/finance/expenses?${q.toString()}`;
}

/**
 * List URL with optional project drill-down and/or sort (same semantics as the expenses list page query).
 */
export function financeExpensesListHref(
  projectId?: string | null,
  listSort?: ExpenseListNavigationSort,
): string {
  const params = new URLSearchParams();
  if (projectId) {
    params.set(PROJECT_EXPENSES_DRILLDOWN_QUERY, projectId);
  }
  if (listSort) {
    setExpenseListSortParams(params, listSort.sortBy, listSort.sortOrder);
  }
  const q = params.toString();
  return q ? `/finance/expenses?${q}` : '/finance/expenses';
}

/**
 * Detail URL preserving list context (project drill-down + sort) for back-navigation parity.
 */
export function expenseDetailHref(
  expenseId: string,
  listProjectId?: string | null,
  listSort?: ExpenseListNavigationSort,
): string {
  const params = new URLSearchParams();
  if (listProjectId) {
    params.set(PROJECT_EXPENSES_DRILLDOWN_QUERY, listProjectId);
  }
  if (listSort) {
    setExpenseListSortParams(params, listSort.sortBy, listSort.sortOrder);
  }
  const q = params.toString();
  return q ? `/finance/expenses/${expenseId}?${q}` : `/finance/expenses/${expenseId}`;
}
