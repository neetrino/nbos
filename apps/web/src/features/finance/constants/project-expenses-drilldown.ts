import type { ExpenseListSortField } from '@/lib/api/finance';
import { setExpenseListSortParams } from './expenses-list-query';

/** Must match `GET /expenses?projectId=` (ExpensesController). */
export const PROJECT_EXPENSES_DRILLDOWN_QUERY = 'projectId' as const;

/** Detail URL: return navigation to `/finance/expenses/backlog` instead of main list. */
export const EXPENSE_FROM_BACKLOG_QUERY = 'from' as const;
export const EXPENSE_FROM_BACKLOG_VALUE = 'backlog' as const;

export const EXPENSE_LIST_PATH = '/finance/expenses' as const;
export const EXPENSE_BACKLOG_LIST_PATH = '/finance/expenses/backlog' as const;

/** Until backlog reasons exist in schema, backlog list filters by Delayed status (NBOS Expenses module). */
export const EXPENSE_BACKLOG_FIXED_STATUS = 'DELAYED' as const;

export interface ExpenseListNavigationSort {
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
}

export interface ExpenseListHrefOptions {
  /** When true, list URL targets the deferred/backlog route (canon UI path). */
  fromBacklog?: boolean;
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
  options?: ExpenseListHrefOptions,
): string {
  const base = options?.fromBacklog === true ? EXPENSE_BACKLOG_LIST_PATH : EXPENSE_LIST_PATH;
  const params = new URLSearchParams();
  if (projectId) {
    params.set(PROJECT_EXPENSES_DRILLDOWN_QUERY, projectId);
  }
  if (listSort) {
    setExpenseListSortParams(params, listSort.sortBy, listSort.sortOrder);
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

/**
 * Detail URL preserving list context (project drill-down + sort) for back-navigation parity.
 */
export function expenseDetailHref(
  expenseId: string,
  listProjectId?: string | null,
  listSort?: ExpenseListNavigationSort,
  options?: ExpenseListHrefOptions,
): string {
  const params = new URLSearchParams();
  if (options?.fromBacklog === true) {
    params.set(EXPENSE_FROM_BACKLOG_QUERY, EXPENSE_FROM_BACKLOG_VALUE);
  }
  if (listProjectId) {
    params.set(PROJECT_EXPENSES_DRILLDOWN_QUERY, listProjectId);
  }
  if (listSort) {
    setExpenseListSortParams(params, listSort.sortBy, listSort.sortOrder);
  }
  const q = params.toString();
  return q ? `/finance/expenses/${expenseId}?${q}` : `/finance/expenses/${expenseId}`;
}
