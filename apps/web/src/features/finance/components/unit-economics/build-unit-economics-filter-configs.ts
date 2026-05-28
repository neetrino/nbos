import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  UE_FILTER_DELIVERY_KEY,
  UE_FILTER_ORDER_TYPE_KEY,
  UE_FILTER_PROJECT_KEY,
} from './filter-unit-economics-data';

export function buildUnitEconomicsFilterConfigs(
  projects: Array<{ id: string; label: string }>,
): FilterConfig[] {
  return [
    {
      key: UE_FILTER_PROJECT_KEY,
      label: 'Project',
      options: projects.map((p) => ({ value: p.id, label: p.label })),
    },
    {
      key: UE_FILTER_ORDER_TYPE_KEY,
      label: 'Unit type',
      options: [
        { value: 'PRODUCT', label: 'Product' },
        { value: 'EXTENSION', label: 'Extension' },
      ],
    },
    {
      key: UE_FILTER_DELIVERY_KEY,
      label: 'Delivery',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  ];
}
