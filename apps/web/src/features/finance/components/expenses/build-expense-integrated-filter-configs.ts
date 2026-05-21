import type { FilterConfig } from '@/components/shared/FilterBar';
import { FINANCE_PERIOD_OPTIONS } from '@/features/finance/constants/finance';
import {
  buildExpenseBoardScopeFilterConfig,
  EXPENSE_PERIOD_FILTER_KEY,
  EXPENSE_SORT_BY_FILTER_KEY,
  EXPENSE_SORT_ORDER_FILTER_KEY,
} from './expense-board-scope';
import { buildExpenseFilterConfigs, type ExpenseFilterBarConfig } from './expenses-filter-config';
import { EXPENSE_LIST_SORT_OPTIONS } from './expense-list-sort-options';

export function buildExpenseIntegratedFilterConfigs(
  projectFilterOptions: Array<{ value: string; label: string }>,
  options: { omitStatus?: boolean; includeBoardScope?: boolean },
): FilterConfig[] {
  const configs: FilterConfig[] = [];

  if (options.includeBoardScope !== false) {
    configs.push(buildExpenseBoardScopeFilterConfig());
  }

  configs.push({
    key: EXPENSE_PERIOD_FILTER_KEY,
    label: 'Period',
    includeAllOption: false,
    defaultOptionValue: 'month',
    options: FINANCE_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  });

  const base = buildExpenseFilterConfigs(projectFilterOptions, {
    omitStatus: options.omitStatus,
  }) as ExpenseFilterBarConfig[];

  for (const item of base) {
    configs.push(item);
  }

  configs.push({
    key: EXPENSE_SORT_BY_FILTER_KEY,
    label: 'Sort by',
    includeAllOption: false,
    defaultOptionValue: 'dueDate',
    options: EXPENSE_LIST_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  });

  configs.push({
    key: EXPENSE_SORT_ORDER_FILTER_KEY,
    label: 'Order',
    includeAllOption: false,
    defaultOptionValue: 'desc',
    options: [
      { value: 'desc', label: 'Descending' },
      { value: 'asc', label: 'Ascending' },
    ],
  });

  return configs;
}
