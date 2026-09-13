import type { FilterConfig } from '@/components/shared/FilterBar';
import { FINANCE_PERIOD_FILTER_KEY } from '@/features/finance/constants/finance-period-filter';
import {
  EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY,
  EXPENSE_PAYROLL_MONTH_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_ALL,
  EXPENSE_PAYROLL_SOURCE_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_PAYROLL,
} from '@/features/finance/constants/expense-payroll-filter';
import {
  EXPENSE_BOARD_SCOPE_FILTER_KEY,
  EXPENSE_SORT_BY_FILTER_KEY,
  EXPENSE_SORT_ORDER_FILTER_KEY,
} from './expense-board-scope';
import {
  translateExpenseCategory,
  translateExpenseStage,
  type ExpensesMessageKey,
  type ExpensesTranslator,
} from './expense-i18n-labels';

const SCOPE_LABEL_KEYS = {
  active: 'scope.active',
  backlog: 'scope.backlog',
  closed: 'scope.closed',
} as const satisfies Record<string, ExpensesMessageKey>;

const PERIOD_LABEL_KEYS = {
  month: 'period.month',
  quarter: 'period.quarter',
  year: 'period.year',
  all: 'period.all',
} as const satisfies Record<string, ExpensesMessageKey>;

const SORT_FIELD_KEYS = {
  createdAt: 'sort.createdAt',
  dueDate: 'sort.dueDate',
  amount: 'sort.amount',
  name: 'sort.name',
  status: 'sort.status',
} as const satisfies Record<string, ExpensesMessageKey>;

const SORT_ORDER_KEYS = {
  desc: 'sort.desc',
  asc: 'sort.asc',
} as const satisfies Record<string, ExpensesMessageKey>;

function mapOptionLabels(
  options: FilterConfig['options'],
  resolve: (value: string) => string,
): FilterConfig['options'] {
  return options.map((option) => ({ ...option, label: resolve(option.value) }));
}

function localizeScopeFilter(config: FilterConfig, t: ExpensesTranslator): FilterConfig {
  return {
    ...config,
    label: t('filters.scope'),
    options: mapOptionLabels(config.options, (value) => {
      const key = SCOPE_LABEL_KEYS[value as keyof typeof SCOPE_LABEL_KEYS];
      return key ? t(key) : value;
    }),
  };
}

function localizePeriodFilter(config: FilterConfig, t: ExpensesTranslator): FilterConfig {
  return {
    ...config,
    label: t('filters.period'),
    options: mapOptionLabels(config.options, (value) => {
      const key = PERIOD_LABEL_KEYS[value as keyof typeof PERIOD_LABEL_KEYS];
      return key ? t(key) : value;
    }),
  };
}

function localizePayrollSourceFilter(config: FilterConfig, t: ExpensesTranslator): FilterConfig {
  return {
    ...config,
    label: t('filters.source'),
    options: mapOptionLabels(config.options, (value) => {
      if (value === EXPENSE_PAYROLL_SOURCE_ALL) return t('filters.sourceAll');
      if (value === EXPENSE_PAYROLL_SOURCE_PAYROLL) return t('filters.sourcePayroll');
      return value;
    }),
  };
}

function localizeSortByFilter(config: FilterConfig, t: ExpensesTranslator): FilterConfig {
  return {
    ...config,
    label: t('filters.sortBy'),
    options: mapOptionLabels(config.options, (value) => {
      const key = SORT_FIELD_KEYS[value as keyof typeof SORT_FIELD_KEYS];
      return key ? t(key) : value;
    }),
  };
}

function localizeSortOrderFilter(config: FilterConfig, t: ExpensesTranslator): FilterConfig {
  return {
    ...config,
    label: t('filters.order'),
    options: mapOptionLabels(config.options, (value) => {
      const key = SORT_ORDER_KEYS[value as keyof typeof SORT_ORDER_KEYS];
      return key ? t(key) : value;
    }),
  };
}

/** Translates expense list/board filter chrome at render; option VALUES stay English. */
export function localizeExpenseFilterConfigs(
  configs: FilterConfig[],
  t: ExpensesTranslator,
): FilterConfig[] {
  return configs.map((config) => {
    switch (config.key) {
      case EXPENSE_BOARD_SCOPE_FILTER_KEY:
        return localizeScopeFilter(config, t);
      case FINANCE_PERIOD_FILTER_KEY:
        return localizePeriodFilter(config, t);
      case EXPENSE_PAYROLL_SOURCE_FILTER_KEY:
        return localizePayrollSourceFilter(config, t);
      case EXPENSE_PAYROLL_MONTH_FILTER_KEY:
        return { ...config, label: t('filters.payrollMonth') };
      case EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY:
        return { ...config, label: t('filters.employee') };
      case 'category':
        return {
          ...config,
          label: t('filters.category'),
          options: mapOptionLabels(config.options, (value) => translateExpenseCategory(value, t)),
        };
      case 'status':
        return {
          ...config,
          label: t('filters.status'),
          options: mapOptionLabels(config.options, (value) => translateExpenseStage(value, t)),
        };
      case 'project':
        return { ...config, label: t('filters.project') };
      case EXPENSE_SORT_BY_FILTER_KEY:
        return localizeSortByFilter(config, t);
      case EXPENSE_SORT_ORDER_FILTER_KEY:
        return localizeSortOrderFilter(config, t);
      default:
        return config;
    }
  });
}
