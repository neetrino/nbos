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
  scope: EntityLifecycleScope;
}

export type CrmStageColumnFetchResult<T> = StageColumnFetchResult<T>;

function getCrmItemStageKey<T extends { status: string }>(item: T): string {
  return item.status;
}

/** CRM adapter over {@link useStageColumnBoard} (status field + trash/list scope in fetch). */
export function useCrmStageColumnBoard<T extends { id: string; status: string }>(options: {
  stageKeys: readonly string[];
  listScope: EntityLifecycleScope;
  search?: string;
  type?: string;
  source?: string;
  enabled?: boolean;
  fetchPage: (params: CrmStageColumnFetchParams) => Promise<CrmStageColumnFetchResult<T>>;
}) {
  const { stageKeys, listScope, search, type, source, enabled = true, fetchPage } = options;
  const debouncedSearch = useDebouncedValue(search ?? '', SEARCH_DEBOUNCE_MS).trim();

  const boundFetchPage = useCallback(
    ({ page, pageSize, status }: { page: number; pageSize: number; status: string }) =>
      fetchPage({
        page,
        pageSize,
        status,
        search: debouncedSearch || undefined,
        type: type || undefined,
        source: source || undefined,
        scope: listScope,
      }),
    [debouncedSearch, fetchPage, listScope, source, type],
  );

  return useStageColumnBoard<T>({
    stageKeys,
    enabled,
    getStageKey: getCrmItemStageKey,
    fetchPage: boundFetchPage,
  });
}
