import type { ExpenseListSortField } from '@/lib/api/finance';
import { OPEN_EXPENSE_QUERY } from './expense-deep-link';
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
  /** When true, list URL targets the closed board route. */
  closed?: boolean;
  /** Preserve plan drill-down when navigating list ↔ detail. */
  expensePlanId?: string | null;
}

function expenseListBasePath(options?: ExpenseListHrefOptions): string {
  if (options?.fromBacklog === true) return EXPENSE_BACKLOG_LIST_PATH;
  if (options?.closed === true) return EXPENSE_CLOSED_LIST_PATH;
  return EXPENSE_LIST_PATH;
}

function appendExpenseListQuery(base: string, params: URLSearchParams): string {
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function buildExpenseListSearchParams(
  projectId?: string | null,
  listSort?: ExpenseListNavigationSort,
  options?: ExpenseListHrefOptions,
): URLSearchParams {
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
  return params;
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
  const params = buildExpenseListSearchParams(projectId, listSort, options);
  return appendExpenseListQuery(expenseListBasePath(options), params);
}

/** Open expense card sheet on the list route (invoice / expense-plan parity). */
export function expenseListWithOpenExpenseHref(
  expenseId: string,
  listProjectId?: string | null,
  listSort?: ExpenseListNavigationSort,
  options?: ExpenseListHrefOptions,
): string {
  const params = buildExpenseListSearchParams(listProjectId, listSort, options);
  params.set(OPEN_EXPENSE_QUERY, expenseId);
  return appendExpenseListQuery(expenseListBasePath(options), params);
}

/**
 * Deep link to open the expense detail sheet on the board/list route.
 */
export function expenseDetailHref(
  expenseId: string,
  listProjectId?: string | null,
  listSort?: ExpenseListNavigationSort,
  options?: ExpenseListHrefOptions,
): string {
  return expenseListWithOpenExpenseHref(expenseId, listProjectId, listSort, options);
}
