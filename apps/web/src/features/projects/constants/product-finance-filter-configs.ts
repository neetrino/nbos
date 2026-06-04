import type { FilterConfig } from '@/components/shared';
import { buildClientServiceIntegratedFilterConfigs } from '@/features/finance/components/client-services/build-client-service-integrated-filter-configs';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TYPES,
} from '@/features/finance/constants/finance';
import { buildExpenseBoardScopeFilterConfig } from '@/features/finance/components/expenses/expense-board-scope';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';

export const PRODUCT_ORDER_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'boardScope',
    label: 'Scope',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'status',
    label: 'Order status',
    options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
      value,
      label: cfg.label,
    })),
  },
];

export const PRODUCT_SUBSCRIPTION_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'type',
    label: 'Type',
    options: SUBSCRIPTION_TYPES.map((row) => ({ value: row.value, label: row.label })),
  },
  {
    key: 'status',
    label: 'Status',
    options: SUBSCRIPTION_STATUSES.map((row) => ({ value: row.value, label: row.label })),
  },
];

export const PRODUCT_EXPENSE_FILTER_CONFIGS: FilterConfig[] = [
  buildExpenseBoardScopeFilterConfig(),
  {
    key: 'category',
    label: 'Category',
    options: EXPENSE_CATEGORIES.map((row) => ({ value: row.value, label: row.label })),
  },
  {
    key: 'status',
    label: 'Status',
    options: EXPENSE_STAGES.map((row) => ({ value: row.value, label: row.label })),
  },
];

export const PRODUCT_CLIENT_SERVICE_FILTER_CONFIGS: FilterConfig[] =
  buildClientServiceIntegratedFilterConfigs();

export function productFinanceFilterConfigs(section: ProductFinanceSection): FilterConfig[] {
  switch (section) {
    case 'orders':
      return PRODUCT_ORDER_FILTER_CONFIGS;
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
