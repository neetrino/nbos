'use client';

import { useCallback } from 'react';
import type { EntityLifecycleScope } from '@nbos/shared';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import {
  useStageColumnBoard,
  type StageColumnFetchResult,
  type StageColumnMeta,
  type StageColumnPageMeta,
} from '@/features/shared/kanban/use-stage-column-board';

export type CrmStageColumnPageMeta = StageColumnPageMeta;
export type CrmStageColumnMeta = StageColumnMeta;

export interface CrmStageColumnFetchParams {
  page: number;
  pageSize: number;
  status: string;
  search?: string;
  type?: string;
  source?: string;
  assignedTo?: string;
  sellerId?: string;
  sellerAssistantId?: string;
  involvedEmployeeId?: string;
  scope: EntityLifecycleScope;
}

export type CrmStageColumnFetchResult<T> = StageColumnFetchResult<T>;

type CrmBoardListFilters = Pick<
  CrmStageColumnFetchParams,
  'type' | 'source' | 'assignedTo' | 'sellerId' | 'sellerAssistantId' | 'involvedEmployeeId'
>;

function getCrmItemStageKey<T extends { status: string }>(item: T): string {
  return item.status;
}

function buildCrmStageColumnFetchParams(
  page: { page: number; pageSize: number; status: string },
  search: string,
  listScope: EntityLifecycleScope,
  filters: CrmBoardListFilters,
): CrmStageColumnFetchParams {
  return {
    ...page,
    search: search || undefined,
    type: filters.type || undefined,
    source: filters.source || undefined,
    assignedTo: filters.assignedTo || undefined,
    sellerId: filters.sellerId || undefined,
    sellerAssistantId: filters.sellerAssistantId || undefined,
    involvedEmployeeId: filters.involvedEmployeeId || undefined,
    scope: listScope,
  };
}

/** CRM adapter over {@link useStageColumnBoard} (status field + trash/list scope in fetch). */
export function useCrmStageColumnBoard<T extends { id: string; status: string }>(options: {
  stageKeys: readonly string[];
  listScope: EntityLifecycleScope;
  search?: string;
  type?: string;
  source?: string;
  assignedTo?: string;
  sellerId?: string;
  sellerAssistantId?: string;
  involvedEmployeeId?: string;
  enabled?: boolean;
  fetchPage: (params: CrmStageColumnFetchParams) => Promise<CrmStageColumnFetchResult<T>>;
}) {
  const {
    stageKeys,
    listScope,
    search,
    type,
    source,
    assignedTo,
    sellerId,
    sellerAssistantId,
    involvedEmployeeId,
    enabled = true,
    fetchPage,
  } = options;
  const debouncedSearch = useDebouncedValue(search ?? '', SEARCH_DEBOUNCE_MS).trim();

  const boundFetchPage = useCallback(
    (page: { page: number; pageSize: number; status: string }) =>
      fetchPage(
        buildCrmStageColumnFetchParams(page, debouncedSearch, listScope, {
          type,
          source,
          assignedTo,
          sellerId,
          sellerAssistantId,
          involvedEmployeeId,
        }),
      ),
    [
      assignedTo,
      debouncedSearch,
      fetchPage,
      involvedEmployeeId,
      listScope,
      sellerAssistantId,
      sellerId,
      source,
      type,
    ],
  );

  return useStageColumnBoard<T>({
    stageKeys,
    enabled,
    getStageKey: getCrmItemStageKey,
    fetchPage: boundFetchPage,
  });
}
