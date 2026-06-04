import type { FilterConfig } from '@/components/shared';
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

const PRODUCT_DOMAIN_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TRANSFERRED', label: 'Transferred' },
] as const;

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

export const PRODUCT_DOMAIN_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    options: PRODUCT_DOMAIN_STATUSES.map((row) => ({ value: row.value, label: row.label })),
  },
];

export function productFinanceFilterConfigs(section: ProductFinanceSection): FilterConfig[] {
  switch (section) {
    case 'orders':
      return PRODUCT_ORDER_FILTER_CONFIGS;
    case 'subscriptions':
      return PRODUCT_SUBSCRIPTION_FILTER_CONFIGS;
    case 'expenses':
      return PRODUCT_EXPENSE_FILTER_CONFIGS;
    case 'domains':
      return PRODUCT_DOMAIN_FILTER_CONFIGS;
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
    case 'domains':
      return 'Search domains by name, provider…';
    default:
      return 'Search…';
  }
}
