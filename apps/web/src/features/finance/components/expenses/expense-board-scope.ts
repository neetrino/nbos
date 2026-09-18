import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  EXPENSE_BACKLOG_LIST_PATH,
  EXPENSE_LIST_PATH,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { ExpensesPageVariant } from './expenses-page-filter-helpers';

export const EXPENSE_BOARD_SCOPE_FILTER_KEY = 'expenseBoard';
export const EXPENSE_PERIOD_FILTER_KEY = 'period';
export const EXPENSE_SORT_BY_FILTER_KEY = 'sortBy';
export const EXPENSE_SORT_ORDER_FILTER_KEY = 'sortOrder';

const EXPENSE_BOARD_SCOPE_OPTIONS = [
  { value: 'active', label: 'Pay now' },
  { value: 'backlog', label: 'Backlog' },
] as const;

export function expenseBoardScopeFromVariant(variant: ExpensesPageVariant): string {
  return variant === 'backlog' ? 'backlog' : 'active';
}

export function expenseBoardPathForScope(scope: string): string {
  return scope === 'backlog' ? EXPENSE_BACKLOG_LIST_PATH : EXPENSE_LIST_PATH;
}

export function buildExpenseBoardScopeFilterConfig(): FilterConfig {
  return {
    key: EXPENSE_BOARD_SCOPE_FILTER_KEY,
    label: 'Scope',
    includeAllOption: false,
    defaultOptionValue: 'active',
    options: [...EXPENSE_BOARD_SCOPE_OPTIONS],
  };
}
