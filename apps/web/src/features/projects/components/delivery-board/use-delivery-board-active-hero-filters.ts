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
  ActiveFilterOptions,
  DeliveryBoardActiveFiltersInput,
} from './delivery-board-active-filters';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

export function useDeliveryBoardActiveHeroFilterConfigs(
  options: ActiveFilterOptions,
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
        key: 'owner',
        label: t('filters.owner'),
        allOptionLabel: t('filters.allOwner'),
        options: options.owners.map((o) => ({ value: o.id, label: o.label })),
      },
      {
        key: 'workStatus',
        label: t('filters.status'),
        allOptionLabel: t('filters.allStatus'),
        options: [
          { value: 'ACTIVE', label: t('filters.inProgress') },
          { value: 'ON_HOLD', label: t('filters.onHold') },
        ],
      },
    ],
    [options, t],
  );
}

export function activeFiltersToHeroValues(
  kindFilter: DeliveryBoardKindFilter,
  filters: DeliveryBoardActiveFiltersInput,
): Record<string, string> {
  return {
    [DELIVERY_BOARD_KIND_FILTER_KEY]: kindFilterToHeroValue(kindFilter),
    owner: filters.ownerId || 'all',
    workStatus: filters.workStatus === 'ALL' ? 'all' : filters.workStatus,
  };
}

export function patchActiveFiltersFromHero(
  kindFilter: DeliveryBoardKindFilter,
  filters: DeliveryBoardActiveFiltersInput,
  key: string,
  value: string,
): { kindFilter: DeliveryBoardKindFilter; filters: DeliveryBoardActiveFiltersInput } {
  if (key === DELIVERY_BOARD_KIND_FILTER_KEY) {
    return { kindFilter: heroValueToKindFilter(value), filters };
  }
  if (key === 'owner') {
    return {
      kindFilter,
      filters: { ...filters, ownerId: value === 'all' ? '' : value },
    };
  }
  if (key === 'workStatus') {
    return {
      kindFilter,
      filters: {
        ...filters,
        workStatus:
          value === 'all' ? 'ALL' : (value as DeliveryBoardActiveFiltersInput['workStatus']),
      },
    };
  }
  return { kindFilter, filters };
}
