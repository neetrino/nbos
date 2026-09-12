import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FilterConfig } from '@/components/shared';
import {
  DELIVERY_BOARD_KIND_FILTER_CONFIG,
  DELIVERY_BOARD_KIND_FILTER_KEY,
  heroValueToKindFilter,
  kindFilterToHeroValue,
} from './delivery-board-kind-hero-filter';
import type {
  ClosedFilterOptions,
  DeliveryBoardClosedFiltersInput,
} from './delivery-board-closed-filters';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

export function useDeliveryBoardClosedHeroFilterConfigs(
  options: ClosedFilterOptions,
): FilterConfig[] {
  const t = useTranslations('deliveryBoard');
  return useMemo(
    () => [
      {
        ...DELIVERY_BOARD_KIND_FILTER_CONFIG,
        label: t('kind.filterLabel'),
        allOptionLabel: t('kind.allOption'),
        options: [
          { value: 'PRODUCT', label: t('kind.products') },
          { value: 'EXTENSION', label: t('kind.extensions') },
        ],
      },
      {
        key: 'projectId',
        label: t('filters.project'),
        allOptionLabel: t('filters.allProject'),
        options: options.projects.map((p) => ({ value: p.id, label: p.label })),
      },
      {
        key: 'result',
        label: t('filters.result'),
        allOptionLabel: t('filters.allResult'),
        options: [
          { value: 'CANCELLED', label: t('filters.cancelled') },
          { value: 'DONE', label: t('filters.done') },
        ],
      },
    ],
    [options, t],
  );
}

export function closedFiltersToHeroValues(
  kindFilter: DeliveryBoardKindFilter,
  filters: DeliveryBoardClosedFiltersInput,
): Record<string, string> {
  return {
    [DELIVERY_BOARD_KIND_FILTER_KEY]: kindFilterToHeroValue(kindFilter),
    projectId: filters.projectId || 'all',
    result: filters.result === 'ALL' ? 'all' : filters.result,
  };
}

export function patchClosedFiltersFromHero(
  kindFilter: DeliveryBoardKindFilter,
  filters: DeliveryBoardClosedFiltersInput,
  key: string,
  value: string,
): { kindFilter: DeliveryBoardKindFilter; filters: DeliveryBoardClosedFiltersInput } {
  if (key === DELIVERY_BOARD_KIND_FILTER_KEY) {
    return { kindFilter: heroValueToKindFilter(value), filters };
  }
  if (key === 'projectId') {
    return {
      kindFilter,
      filters: { ...filters, projectId: value === 'all' ? '' : value },
    };
  }
  if (key === 'result') {
    return {
      kindFilter,
      filters: {
        ...filters,
        result: value === 'all' ? 'ALL' : (value as DeliveryBoardClosedFiltersInput['result']),
      },
    };
  }
  return { kindFilter, filters };
}
