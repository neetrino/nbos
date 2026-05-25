import { useMemo } from 'react';
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
  return useMemo(
    () => [
      DELIVERY_BOARD_KIND_FILTER_CONFIG,
      {
        key: 'projectId',
        label: 'Project',
        options: options.projects.map((p) => ({ value: p.id, label: p.label })),
      },
      {
        key: 'result',
        label: 'Result',
        options: [
          { value: 'DONE', label: 'Done' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
      },
    ],
    [options],
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
