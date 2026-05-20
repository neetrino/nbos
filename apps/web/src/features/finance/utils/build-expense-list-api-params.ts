import { getFinancePeriodParams, type FinancePeriod } from '../constants/finance';
import type {
  ExpenseListParams,
  ExpenseListSortField,
  ExpenseStatsQueryParams,
} from '@/lib/api/finance';

/** Page size for the on-screen expenses table/kanban (separate from CSV export chunking). */
export const EXPENSE_LIST_UI_PAGE_SIZE = 100;

export function buildExpenseListApiParams(input: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  effectiveProjectId?: string;
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
  /** Main board omits paid + backlog statuses unless a specific status filter is set (NBOS Expense Board). */
  pageVariant?: 'default' | 'backlog' | 'closed';
  /** URL drill-down: all statuses for cards linked to this plan (do not apply default active-board scope). */
  expensePlanIdFromUrl?: string | null;
}): Omit<ExpenseListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  const projectParams =
    input.effectiveProjectId !== undefined ? { projectId: input.effectiveProjectId } : {};
  const variant = input.pageVariant ?? 'default';
  const status =
    input.filters.status && input.filters.status !== 'all' ? input.filters.status : undefined;
  const planIdTrimmed = input.expensePlanIdFromUrl?.trim() ?? '';
  const planParams = planIdTrimmed ? { expensePlanId: planIdTrimmed } : {};
  const activeBoard =
    variant === 'default' && status === undefined && !planIdTrimmed
      ? ({ activeBoard: true } as const)
      : {};
  const closedBoard =
    variant === 'closed' && status === undefined && !planIdTrimmed
      ? ({ closedBoard: true } as const)
      : {};
  return {
    search: input.search || undefined,
    category:
      input.filters.category && input.filters.category !== 'all'
        ? input.filters.category
        : undefined,
    status,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    ...periodParams,
    ...projectParams,
    ...planParams,
    ...activeBoard,
    ...closedBoard,
  };
}

/** Mirrors `GET /expenses/stats` scope vs the list: same period, project, plan, status, activeBoard — no search/category/type/frequency/sort. */
export function pickExpenseStatsQueryParams(
  list: Omit<ExpenseListParams, 'page' | 'pageSize'>,
): ExpenseStatsQueryParams {
  return {
    dateFrom: list.dateFrom,
    dateTo: list.dateTo,
    projectId: list.projectId,
    expensePlanId: list.expensePlanId,
    status: list.status,
    activeBoard: list.activeBoard,
    closedBoard: list.closedBoard,
  };
}
