import type { FilterConfig } from '@/components/shared';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';

/** Embedded product Finance tab — order filters without period drill-down. */
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
