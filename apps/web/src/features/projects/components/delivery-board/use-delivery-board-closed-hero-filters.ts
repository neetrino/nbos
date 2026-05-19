import { useMemo } from 'react';
import type { FilterConfig } from '@/components/shared';
import type {
  ClosedFilterOptions,
  DeliveryBoardClosedFiltersInput,
} from './delivery-board-closed-filters';

export function useDeliveryBoardClosedHeroFilterConfigs(
  options: ClosedFilterOptions,
): FilterConfig[] {
  return useMemo(
    () => [
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
  filters: DeliveryBoardClosedFiltersInput,
): Record<string, string> {
  return {
    projectId: filters.projectId || 'all',
    result: filters.result === 'ALL' ? 'all' : filters.result,
  };
}

export function patchClosedFiltersFromHero(
  filters: DeliveryBoardClosedFiltersInput,
  key: string,
  value: string,
): DeliveryBoardClosedFiltersInput {
  if (key === 'projectId') {
    return { ...filters, projectId: value === 'all' ? '' : value };
  }
  if (key === 'result') {
    return {
      ...filters,
      result: value === 'all' ? 'ALL' : (value as DeliveryBoardClosedFiltersInput['result']),
    };
  }
  return filters;
}
