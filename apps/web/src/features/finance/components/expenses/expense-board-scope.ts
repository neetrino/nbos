import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  EXPENSE_BACKLOG_LIST_PATH,
  EXPENSE_CLOSED_LIST_PATH,
  EXPENSE_LIST_PATH,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { ExpensesPageVariant } from './expenses-page-filter-helpers';

export const EXPENSE_BOARD_SCOPE_FILTER_KEY = 'expenseBoard';
export const EXPENSE_PERIOD_FILTER_KEY = 'period';
export const EXPENSE_SORT_BY_FILTER_KEY = 'sortBy';
export const EXPENSE_SORT_ORDER_FILTER_KEY = 'sortOrder';

const EXPENSE_BOARD_SCOPE_OPTIONS = [
  { value: 'active', label: 'Active board' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'closed', label: 'Closed' },
] as const;

export function expenseBoardScopeFromVariant(variant: ExpensesPageVariant): string {
  if (variant === 'backlog') return 'backlog';
  if (variant === 'closed') return 'closed';
  return 'active';
}

export function expenseBoardPathForScope(scope: string): string {
  if (scope === 'backlog') return EXPENSE_BACKLOG_LIST_PATH;
  if (scope === 'closed') return EXPENSE_CLOSED_LIST_PATH;
  return EXPENSE_LIST_PATH;
}

export function buildExpenseBoardScopeFilterConfig(): FilterConfig {
  return {
    key: EXPENSE_BOARD_SCOPE_FILTER_KEY,
    label: 'Board',
    includeAllOption: false,
    defaultOptionValue: 'active',
    options: [...EXPENSE_BOARD_SCOPE_OPTIONS],
  };
}
