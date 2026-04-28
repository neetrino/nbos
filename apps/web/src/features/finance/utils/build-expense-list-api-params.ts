import { getFinancePeriodParams, type FinancePeriod } from '../constants/finance';
import type { ExpenseListParams, ExpenseListSortField } from '@/lib/api/finance';

/** Page size for the on-screen expenses table/kanban (separate from CSV export chunking). */
export const EXPENSE_LIST_UI_PAGE_SIZE = 100;

export function buildExpenseListApiParams(input: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  effectiveProjectId?: string;
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
}): Omit<ExpenseListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  const projectParams =
    input.effectiveProjectId !== undefined ? { projectId: input.effectiveProjectId } : {};
  return {
    search: input.search || undefined,
    category:
      input.filters.category && input.filters.category !== 'all'
        ? input.filters.category
        : undefined,
    status:
      input.filters.status && input.filters.status !== 'all' ? input.filters.status : undefined,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    ...periodParams,
    ...projectParams,
  };
}
