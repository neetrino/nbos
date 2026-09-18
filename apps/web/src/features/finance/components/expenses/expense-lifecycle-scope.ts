import type { FilterConfig } from '@/components/shared/FilterBar';
import { EXPENSE_LIFECYCLE_SCOPE_QUERY } from '@/features/finance/constants/project-expenses-drilldown';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';

export const EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY = EXPENSE_LIFECYCLE_SCOPE_QUERY;

export type ExpensesKanbanScope = 'active' | 'closed' | 'all';

export function buildExpenseLifecycleScopeFilterConfig(): FilterConfig {
  return {
    key: EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY,
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  };
}

export function expenseKanbanScopeFromBoardScope(scope: BoardLifecycleScope): ExpensesKanbanScope {
  if (scope === 'CLOSED') return 'closed';
  if (scope === 'ALL') return 'all';
  return 'active';
}
