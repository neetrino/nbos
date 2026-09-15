import type { FilterConfig } from '@/components/shared';
import {
  buildClientServiceIntegratedFilterConfigs,
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from '@/features/finance/components/client-services/build-client-service-integrated-filter-configs';
import {
  EXPENSE_FILTER_CATEGORIES,
  EXPENSE_STAGES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import { BOARD_LIFECYCLE_SCOPE_OPTIONS } from '@/features/shared/board-lifecycle';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';
import { INVOICE_MONEY_STAGES } from '@/features/finance/constants/finance';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import {
  PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
  PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
} from '@/features/projects/utils/resolve-product-finance-scope';

const PRODUCT_FINANCE_BOARD_SCOPE_FILTER: FilterConfig = {
  key: 'boardScope',
  label: 'Scope',
  includeAllOption: false,
  defaultOptionValue: PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
  options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
};

export const PRODUCT_ORDER_FILTER_CONFIGS: FilterConfig[] = [
  PRODUCT_FINANCE_BOARD_SCOPE_FILTER,
  {
    key: 'status',
    label: 'Order status',
    defaultOptionValue: 'all',
    allOptionLabel: 'All statuses',
    options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
      value,
      label: cfg.label,
    })),
  },
];

export const PRODUCT_INVOICE_FILTER_CONFIGS: FilterConfig[] = [
  PRODUCT_FINANCE_BOARD_SCOPE_FILTER,
  {
    key: 'moneyStatus',
    label: 'Money status',
    defaultOptionValue: 'all',
    allOptionLabel: 'All statuses',
    options: INVOICE_MONEY_STAGES.map((stage) => ({ value: stage.value, label: stage.label })),
  },
];

export const PRODUCT_SUBSCRIPTION_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'type',
    label: 'Type',
    options: SUBSCRIPTION_TYPES.map((row) => ({ value: row.value, label: row.label })),
    defaultOptionValue: 'all',
    allOptionLabel: 'All types',
  },
  {
    key: 'status',
    label: 'Status',
    options: SUBSCRIPTION_STATUSES.map((row) => ({ value: row.value, label: row.label })),
    defaultOptionValue: 'all',
    allOptionLabel: 'All statuses',
  },
];

export const PRODUCT_EXPENSE_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: EXPENSE_BOARD_SCOPE_FILTER_KEY,
    label: 'Scope',
    includeAllOption: false,
    defaultOptionValue: PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
    options: [
      { value: PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE, label: 'All statuses' },
      { value: 'active', label: 'Pay now' },
      { value: 'backlog', label: 'Backlog' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    options: EXPENSE_FILTER_CATEGORIES.map((row) => ({ value: row.value, label: row.label })),
    defaultOptionValue: 'all',
    allOptionLabel: 'All categories',
  },
  {
    key: 'status',
    label: 'Status',
    options: EXPENSE_STAGES.map((row) => ({ value: row.value, label: row.label })),
    defaultOptionValue: 'all',
    allOptionLabel: 'All statuses',
  },
];

const CLIENT_SERVICE_ALL_LABEL: Record<string, string> = {
  [CLIENT_SERVICE_FILTER_TYPE_KEY]: 'All types',
  [CLIENT_SERVICE_FILTER_STATUS_KEY]: 'All statuses',
  [CLIENT_SERVICE_FILTER_BILLING_KEY]: 'All billing',
};

export const PRODUCT_CLIENT_SERVICE_FILTER_CONFIGS: FilterConfig[] =
  buildClientServiceIntegratedFilterConfigs().map((config) => ({
    ...config,
    defaultOptionValue: 'all',
    allOptionLabel: CLIENT_SERVICE_ALL_LABEL[config.key] ?? `All ${config.label}`,
  }));

export function productFinanceFilterConfigs(section: ProductFinanceSection): FilterConfig[] {
  switch (section) {
    case 'orders':
      return PRODUCT_ORDER_FILTER_CONFIGS;
    case 'invoices':
      return PRODUCT_INVOICE_FILTER_CONFIGS;
    case 'subscriptions':
      return PRODUCT_SUBSCRIPTION_FILTER_CONFIGS;
    case 'expenses':
      return PRODUCT_EXPENSE_FILTER_CONFIGS;
    case 'client-services':
      return PRODUCT_CLIENT_SERVICE_FILTER_CONFIGS;
    default:
      return [];
  }
}

export function productFinanceSearchPlaceholder(section: ProductFinanceSection): string {
  switch (section) {
    case 'orders':
      return 'Search orders by code, type…';
    case 'invoices':
      return 'Search invoices by code, company…';
    case 'subscriptions':
      return 'Search subscriptions by code, type…';
    case 'expenses':
      return 'Search expenses by name, category…';
    case 'client-services':
      return 'Search by name or provider…';
    default:
      return 'Search…';
  }
}
