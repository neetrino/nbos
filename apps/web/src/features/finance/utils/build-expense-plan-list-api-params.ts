import { coerceExpenseCategoryToCanonical } from '@/features/finance/constants/expense-category-canonical';
import {
  EXPENSE_PLAN_STATUS_FILTER_ACTIVE,
  EXPENSE_PLAN_STATUS_FILTER_ALL,
  resolveExpensePlanStatusApiParam,
} from '@/features/finance/constants/expense-plan-status';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import type { ExpensePlanListParams } from '@/lib/api/expense-plans';

const EXPENSE_PLAN_LIST_ALLOWED_CATEGORIES: ReadonlySet<string> = new Set(
  EXPENSE_CATEGORIES.map((c) => c.value),
);

export function parseExpensePlansListCategoryParam(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  const canonical = coerceExpenseCategoryToCanonical(v) ?? v;
  return EXPENSE_PLAN_LIST_ALLOWED_CATEGORIES.has(canonical) ? canonical : undefined;
}

export function parseExpensePlansListProjectIdParam(raw: string | null): string | undefined {
  const v = raw?.trim();
  return v ? v : undefined;
}

export function parseExpensePlansListSearchParam(raw: string | null): string {
  return (raw ?? '').trim();
}

const EXPENSE_PLAN_STATUS_FILTERS = new Set([
  EXPENSE_PLAN_STATUS_FILTER_ACTIVE,
  'CANCELLED',
  EXPENSE_PLAN_STATUS_FILTER_ALL,
]);

export function parseExpensePlansListStatusParam(raw: string | null): string {
  const v = raw?.trim();
  if (v && EXPENSE_PLAN_STATUS_FILTERS.has(v)) {
    return v;
  }
  return EXPENSE_PLAN_STATUS_FILTER_ACTIVE;
}

export type ExpensePlanListFilterInput = {
  search: string;
  category?: string;
  projectId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function expensePlanListFilterParams(
  input: Pick<ExpensePlanListFilterInput, 'search' | 'category' | 'projectId' | 'status'>,
): Pick<
  ExpensePlanListParams,
  'search' | 'category' | 'projectId' | 'status' | 'sortBy' | 'sortOrder'
> {
  const search = input.search.trim();
  const status = resolveExpensePlanStatusApiParam(input.status);
  return {
    sortBy: 'name',
    sortOrder: 'asc',
    ...(search ? { search } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.projectId?.trim() ? { projectId: input.projectId.trim() } : {}),
    ...(status ? { status } : {}),
  };
}

export function buildExpensePlanListApiParams(
  input: ExpensePlanListFilterInput,
): ExpensePlanListParams {
  return {
    ...expensePlanListFilterParams(input),
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.pageSize !== undefined ? { pageSize: input.pageSize } : {}),
  };
}

export function buildExpensePlanListExportParams(
  input: Pick<ExpensePlanListFilterInput, 'search' | 'category' | 'projectId' | 'status'>,
): Omit<ExpensePlanListParams, 'page' | 'pageSize'> {
  return expensePlanListFilterParams(input);
}

export function expensePlanListHasActiveFilters(input: {
  search: string;
  category?: string;
  projectId?: string;
  status?: string;
}): boolean {
  const status = input.status?.trim();
  const statusIsDefault = !status || status === EXPENSE_PLAN_STATUS_FILTER_ACTIVE;
  return Boolean(
    input.search.trim() || input.category || input.projectId?.trim() || !statusIsDefault,
  );
}
