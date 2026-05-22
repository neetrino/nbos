import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_PERIOD_FILTER_KEY,
} from '@/features/finance/constants/finance-period-filter';
import {
  buildExpenseBoardScopeFilterConfig,
  EXPENSE_SORT_BY_FILTER_KEY,
  EXPENSE_SORT_ORDER_FILTER_KEY,
} from './expense-board-scope';
import { buildPayrollExpenseFilterConfigs } from './build-payroll-expense-filter-configs';
import { buildExpenseFilterConfigs, type ExpenseFilterBarConfig } from './expenses-filter-config';
import { EXPENSE_LIST_SORT_OPTIONS } from './expense-list-sort-options';

export function buildExpenseIntegratedFilterConfigs(
  projectFilterOptions: Array<{ value: string; label: string }>,
  payrollEmployeeOptions: Array<{ value: string; label: string }>,
  options: { omitStatus?: boolean; includeBoardScope?: boolean; includePayrollFilters?: boolean },
): FilterConfig[] {
  const configs: FilterConfig[] = [];

  if (options.includeBoardScope !== false) {
    configs.push(buildExpenseBoardScopeFilterConfig());
  }

  configs.push(buildFinancePeriodFilterConfig());

  if (options.includePayrollFilters !== false) {
    configs.push(...buildPayrollExpenseFilterConfigs(payrollEmployeeOptions));
  }

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
