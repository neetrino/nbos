import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import { buildFinancePeriodFilterConfig } from '@/features/finance/constants/finance-period-filter';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';

const ORDER_BOARD_SCOPE_FILTER: FilterConfig = {
  key: 'boardScope',
  label: 'Scope',
  includeAllOption: false,
  defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
  options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
};

export function buildOrderFilterConfigs(): FilterConfig[] {
  return [
    buildFinancePeriodFilterConfig(),
    ORDER_BOARD_SCOPE_FILTER,
    {
      key: 'status',
      label: 'Order status',
      options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
        value,
        label: cfg.label,
      })),
    },
  ];
}
