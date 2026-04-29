import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import type { ExpensePlanListParams } from '@/lib/api/expense-plans';

const EXPENSE_PLAN_LIST_ALLOWED_CATEGORIES: ReadonlySet<string> = new Set(
  EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE').map((c) => c.value),
);

export function parseExpensePlansListCategoryParam(raw: string | null): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  return EXPENSE_PLAN_LIST_ALLOWED_CATEGORIES.has(v) ? v : undefined;
}

export function parseExpensePlansListProjectIdParam(raw: string | null): string | undefined {
  const v = raw?.trim();
  return v ? v : undefined;
}

export function parseExpensePlansListSearchParam(raw: string | null): string {
  return (raw ?? '').trim();
}

export type ExpensePlanListFilterInput = {
  search: string;
  category?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
};

function expensePlanListFilterParams(
  input: Pick<ExpensePlanListFilterInput, 'search' | 'category' | 'projectId'>,
): Pick<ExpensePlanListParams, 'search' | 'category' | 'projectId' | 'sortBy' | 'sortOrder'> {
  const search = input.search.trim();
  return {
    sortBy: 'name',
    sortOrder: 'asc',
    ...(search ? { search } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.projectId?.trim() ? { projectId: input.projectId.trim() } : {}),
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
  input: Pick<ExpensePlanListFilterInput, 'search' | 'category' | 'projectId'>,
): Omit<ExpensePlanListParams, 'page' | 'pageSize'> {
  return expensePlanListFilterParams(input);
}

export function expensePlanListHasActiveFilters(input: {
  search: string;
  category?: string;
  projectId?: string;
}): boolean {
  return Boolean(input.search.trim() || input.category || input.projectId?.trim());
}
