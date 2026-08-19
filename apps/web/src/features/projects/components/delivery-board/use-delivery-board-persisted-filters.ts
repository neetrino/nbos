'use client';

import { useState } from 'react';
import {
  SEARCH_FILTER_PAGE_ID,
  usePersistedSearchFilterField,
  usePersistedSearchFilters,
} from '@/lib/persisted-client-state';
import {
  DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS,
  type DeliveryBoardActiveFiltersInput,
} from './delivery-board-active-filters';
import type { DeliveryBoardClosedFiltersInput } from './delivery-board-closed-filters';
import { heroValueToKindFilter, kindFilterToHeroValue } from './delivery-board-kind-hero-filter';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';

const DEFAULT_CLOSED_FILTERS: DeliveryBoardClosedFiltersInput = {
  search: '',
  projectId: '',
  companyId: '',
  ownerId: '',
  productLineKey: '',
  closedFrom: '',
  closedTo: '',
  deadlineResult: 'ALL',
  result: 'ALL',
};

function parseClosedResult(raw: string | undefined): DeliveryBoardClosedFiltersInput['result'] {
  return raw === 'DONE' || raw === 'CANCELLED' ? raw : 'ALL';
}

function parseActiveWorkStatus(
  raw: string | undefined,
): DeliveryBoardActiveFiltersInput['workStatus'] {
  return raw === 'ACTIVE' || raw === 'ON_HOLD' ? raw : 'ALL';
}

export function useDeliveryBoardPersistedFilters() {
  const [kindRaw, setKindRaw] = usePersistedSearchFilterField(
    `${SEARCH_FILTER_PAGE_ID.deliveryBoardActive}.kind`,
    'kind',
    'ALL',
  );
  const kindFilter = heroValueToKindFilter(kindRaw);
  const setKindFilter = (next: DeliveryBoardKindFilter) => setKindRaw(kindFilterToHeroValue(next));

  const [closedFacets, setClosedFacets] = usePersistedSearchFilters(
    SEARCH_FILTER_PAGE_ID.deliveryBoardClosed,
    { projectId: '', result: 'ALL' },
  );
  const [closedSearch, setClosedSearch] = useState('');
  const closedFilters: DeliveryBoardClosedFiltersInput = {
    ...DEFAULT_CLOSED_FILTERS,
    search: closedSearch,
    projectId: closedFacets.projectId ?? '',
    result: parseClosedResult(closedFacets.result),
  };
  const setClosedFilters = (next: DeliveryBoardClosedFiltersInput) => {
    setClosedSearch(next.search);
    setClosedFacets({ projectId: next.projectId, result: next.result });
  };

  const [activeFacets, setActiveFacets] = usePersistedSearchFilters(
    SEARCH_FILTER_PAGE_ID.deliveryBoardActive,
    { ownerId: '', workStatus: 'ALL' },
  );
  const [activeSearch, setActiveSearch] = useState('');
  const activePipelineFilters: DeliveryBoardActiveFiltersInput = {
    ...DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS,
    search: activeSearch,
    ownerId: activeFacets.ownerId ?? '',
    workStatus: parseActiveWorkStatus(activeFacets.workStatus),
  };
  const setActivePipelineFilters = (next: DeliveryBoardActiveFiltersInput) => {
    setActiveSearch(next.search);
    setActiveFacets({ ownerId: next.ownerId, workStatus: next.workStatus });
  };

  return {
    kindFilter,
    setKindFilter,
    closedFilters,
    setClosedFilters,
    activePipelineFilters,
    setActivePipelineFilters,
  };
}
