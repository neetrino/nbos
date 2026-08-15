'use client';

import type { EntityLifecycleScope } from '@nbos/shared';
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

  return useStageColumnBoard<T>({
    stageKeys,
    enabled,
    getStageKey: (item) => item.status,
    fetchPage: ({ page, pageSize, status }) =>
      fetchPage({
        page,
        pageSize,
        status,
        search: search || undefined,
        type: type || undefined,
        source: source || undefined,
        scope: listScope,
      }),
  });
}
