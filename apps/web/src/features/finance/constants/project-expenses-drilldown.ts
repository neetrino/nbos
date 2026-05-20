import type { ExpenseListSortField } from '@/lib/api/finance';
import { setExpenseListSortParams } from './expenses-list-query';

/** Must match `GET /expenses?projectId=` (ExpensesController). */
export const PROJECT_EXPENSES_DRILLDOWN_QUERY = 'projectId' as const;

/** Must match `GET /expenses?expensePlanId=` (ExpensesController). */
export const EXPENSE_PLAN_DRILLDOWN_QUERY = 'expensePlanId' as const;

/** Detail URL: return navigation to `/finance/expenses/backlog` instead of main list. */
export const EXPENSE_FROM_BACKLOG_QUERY = 'from' as const;
export const EXPENSE_FROM_BACKLOG_VALUE = 'backlog' as const;

export const EXPENSE_LIST_PATH = '/finance/expenses' as const;
export const EXPENSE_BACKLOG_LIST_PATH = '/finance/expenses/backlog' as const;
/** NBOS: paid cards live off the active board (`04-Finance-Pages` Closed scope). */
export const EXPENSE_CLOSED_LIST_PATH = '/finance/expenses/closed' as const;

/** Backlog list uses `BACKLOG` + `backlogReason` in API/UI (NBOS Expense Backlog path). */
export const EXPENSE_BACKLOG_FIXED_STATUS = 'BACKLOG' as const;

/** Closed list filters by paid status (ledger may still show partial history on older rows). */
export const EXPENSE_CLOSED_FIXED_STATUS = 'PAID' as const;

export interface ExpenseListNavigationSort {
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
}

export interface ExpenseListHrefOptions {
  /** When true, list URL targets the deferred/backlog route (canon UI path). */
  fromBacklog?: boolean;
  /** Preserve plan drill-down when navigating list ↔ detail. */
  expensePlanId?: string | null;
}

export function projectExpensesDrilldownHref(projectId: string): string {
  const q = new URLSearchParams({
    [PROJECT_EXPENSES_DRILLDOWN_QUERY]: projectId,
  });
  return `/finance/expenses?${q.toString()}`;
}

/** Main expense list filtered to cards generated from / linked to this plan. */
export function planExpensesDrilldownHref(expensePlanId: string): string {
  const q = new URLSearchParams({
    [EXPENSE_PLAN_DRILLDOWN_QUERY]: expensePlanId,
  });
  return `/finance/expenses?${q.toString()}`;
}

/** Project-scoped expense backlog list (`Delayed` scope until backlog schema exists). */
export function projectExpensesBacklogDrilldownHref(projectId: string): string {
  const q = new URLSearchParams({
    [PROJECT_EXPENSES_DRILLDOWN_QUERY]: projectId,
  });
  return `${EXPENSE_BACKLOG_LIST_PATH}?${q.toString()}`;
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
  const planId = options?.expensePlanId?.trim();
  if (planId) {
    params.set(EXPENSE_PLAN_DRILLDOWN_QUERY, planId);
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
  const planFromOptions = options?.expensePlanId?.trim();
  if (planFromOptions) {
    params.set(EXPENSE_PLAN_DRILLDOWN_QUERY, planFromOptions);
  }
  if (listSort) {
    setExpenseListSortParams(params, listSort.sortBy, listSort.sortOrder);
  }
  const q = params.toString();
  return q ? `/finance/expenses/${expenseId}?${q}` : `/finance/expenses/${expenseId}`;
}
