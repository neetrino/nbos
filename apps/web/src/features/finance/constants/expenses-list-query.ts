import type { ExpenseListSortField } from '@/lib/api/finance';

/** Query keys aligned with `GET /expenses` (`sortBy`, `sortOrder`). */
export const EXPENSE_LIST_SORT_BY_QUERY = 'sortBy' as const;
export const EXPENSE_LIST_SORT_ORDER_QUERY = 'sortOrder' as const;

export const EXPENSE_LIST_DEFAULT_SORT_BY: ExpenseListSortField = 'createdAt';
export const EXPENSE_LIST_DEFAULT_SORT_ORDER = 'desc' as const;

const SORT_FIELD_SET = new Set<string>(['createdAt', 'dueDate', 'amount', 'name', 'status']);

/**
 * Parses `sortBy` from the expenses list URL (invalid or missing → default).
 */
export function parseExpenseListSortByParam(raw: string | null): ExpenseListSortField {
  if (raw !== null && SORT_FIELD_SET.has(raw)) {
    return raw as ExpenseListSortField;
  }
  return EXPENSE_LIST_DEFAULT_SORT_BY;
}

/**
 * Parses `sortOrder` from the expenses list URL (invalid or missing → default).
 */
export function parseExpenseListSortOrderParam(raw: string | null): 'asc' | 'desc' {
  return raw === 'asc' ? 'asc' : 'desc';
}

/**
 * Writes sort params to a URLSearchParams instance; omits keys when they match UI defaults
 * so `/finance/expenses` stays clean unless the user overrides sort.
 */
export function setExpenseListSortParams(
  params: URLSearchParams,
  sortBy: ExpenseListSortField,
  sortOrder: 'asc' | 'desc',
): void {
  const isDefault =
    sortBy === EXPENSE_LIST_DEFAULT_SORT_BY && sortOrder === EXPENSE_LIST_DEFAULT_SORT_ORDER;
  if (isDefault) {
    params.delete(EXPENSE_LIST_SORT_BY_QUERY);
    params.delete(EXPENSE_LIST_SORT_ORDER_QUERY);
    return;
  }
  params.set(EXPENSE_LIST_SORT_BY_QUERY, sortBy);
  params.set(EXPENSE_LIST_SORT_ORDER_QUERY, sortOrder);
}
