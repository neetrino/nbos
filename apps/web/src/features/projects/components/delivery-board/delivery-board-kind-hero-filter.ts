import type { FilterConfig } from '@/components/shared';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

export const DELIVERY_BOARD_KIND_FILTER_KEY = 'kind';

export const DELIVERY_BOARD_KIND_FILTER_CONFIG: FilterConfig = {
  key: DELIVERY_BOARD_KIND_FILTER_KEY,
  label: 'Type',
  options: [
    { value: 'PRODUCT', label: 'Products' },
    { value: 'EXTENSION', label: 'Extensions' },
  ],
};

export function kindFilterToHeroValue(kind: DeliveryBoardKindFilter): string {
  return kind === 'ALL' ? 'all' : kind;
}

export function heroValueToKindFilter(value: string): DeliveryBoardKindFilter {
  if (value === 'PRODUCT' || value === 'EXTENSION') return value;
  return 'ALL';
}
