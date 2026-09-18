import { getFinancePeriodParams, type FinancePeriod } from '../constants/finance';
import { resolveExpensePayrollListParams } from '../constants/expense-payroll-filter';
import {
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type {
  ExpenseListParams,
  ExpenseListSortField,
  ExpenseStatsQueryParams,
} from '@/lib/api/finance';

/** Page size for the on-screen expenses table/kanban (separate from CSV export chunking). */
export const EXPENSE_LIST_UI_PAGE_SIZE = 100;

type ExpensePageVariant = 'default' | 'backlog' | 'closed' | 'all';

function payNowBoardFlags(
  variant: ExpensePageVariant,
  status: string | undefined,
  boardScope: BoardLifecycleScope,
): Pick<ExpenseListParams, 'activeBoard' | 'closedBoard' | 'lifecycleBoard'> {
  if (status !== undefined) {
    return {};
  }
  if (variant === 'closed') {
    return { closedBoard: true };
  }
  if (variant !== 'default') {
    return {};
  }
  if (boardScope === 'CLOSED') {
    return { closedBoard: true };
  }
  if (boardScope === 'ALL') {
    return { lifecycleBoard: true };
  }
  return { activeBoard: true };
}

function resolveListStatusFilter(
  filters: Record<string, string>,
  ignoreStatusFilter: boolean | undefined,
): string | undefined {
  if (ignoreStatusFilter === true) {
    return undefined;
  }
  return filters.status && filters.status !== 'all' ? filters.status : undefined;
}

export function buildExpenseListApiParams(input: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  effectiveProjectId?: string;
  effectiveProductId?: string;
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
  /** Main board omits paid + backlog + cancelled unless a specific status filter is set. */
  pageVariant?: ExpensePageVariant;
  /** Plan drill-down keeps Pay now lifecycle flags (does not open the full journal). */
  expensePlanIdFromUrl?: string | null;
  /** Pay now: ignore leftover persisted Status (dropdown removed). */
  ignoreStatusFilter?: boolean;
}): Omit<ExpenseListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  const projectParams =
    input.effectiveProjectId !== undefined ? { projectId: input.effectiveProjectId } : {};
  const productParams =
    input.effectiveProductId !== undefined ? { productId: input.effectiveProductId } : {};
  const variant = input.pageVariant ?? 'default';
  const status = resolveListStatusFilter(input.filters, input.ignoreStatusFilter);
  const planIdTrimmed = input.expensePlanIdFromUrl?.trim() ?? '';
  const planParams = planIdTrimmed ? { expensePlanId: planIdTrimmed } : {};
  const boardFlags = payNowBoardFlags(
    variant,
    status,
    resolveBoardLifecycleScope(input.filters.boardScope),
  );
  const payrollParams = resolveExpensePayrollListParams(input.filters);
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
    ...productParams,
    ...planParams,
    ...boardFlags,
    ...payrollParams,
  };
}

/** Mirrors `GET /expenses/stats` scope vs the list: same period, project, plan, status, board flags — no search/category/type/frequency/sort. */
export function pickExpenseStatsQueryParams(
  list: Omit<ExpenseListParams, 'page' | 'pageSize'>,
): ExpenseStatsQueryParams {
  return {
    dateFrom: list.dateFrom,
    dateTo: list.dateTo,
    projectId: list.projectId,
    productId: list.productId,
    expensePlanId: list.expensePlanId,
    status: list.status,
    activeBoard: list.activeBoard,
    closedBoard: list.closedBoard,
    lifecycleBoard: list.lifecycleBoard,
    payrollLinked: list.payrollLinked,
    payrollMonth: list.payrollMonth,
    payrollEmployeeId: list.payrollEmployeeId,
  };
}
