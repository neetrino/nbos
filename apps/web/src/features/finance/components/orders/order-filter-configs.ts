import type { FilterConfig } from '@/components/shared/FilterBar';
import { buildFinancePeriodFilterConfig } from '@/features/finance/constants/finance-period-filter';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';

export const ORDER_FILTER_CONFIGS: FilterConfig[] = [
  buildFinancePeriodFilterConfig(),
  {
    key: 'status',
    label: 'Status',
    options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
      value,
      label: cfg.label,
    })),
  },
];
