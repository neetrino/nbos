'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EntityLifecycleScope } from '@nbos/shared';
import { CRM_KANBAN_COLUMN_PAGE_SIZE } from '@/features/crm/constants/crm-kanban-column-page';

export interface CrmStageColumnPageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CrmStageColumnFetchParams {
  page: number;
  pageSize: number;
  status: string;
  search?: string;
  type?: string;
  source?: string;
  scope: EntityLifecycleScope;
}

export interface CrmStageColumnFetchResult<T> {
  items: T[];
  meta: CrmStageColumnPageMeta;
}

export interface CrmStageColumnMeta {
  totalCount: number;
  hasMore: boolean;
  loadingMore: boolean;
}

interface StageBucket<T> {
  items: T[];
  page: number;
  total: number;
  totalPages: number;
  loadingMore: boolean;
}

function emptyBucket<T>(): StageBucket<T> {
  return { items: [], page: 0, total: 0, totalPages: 0, loadingMore: false };
}

function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const seen = new Set(existing.map((row) => row.id));
  const next = [...existing];
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    next.push(row);
  }
  return next;
}

function parseStageKeys(signature: string): string[] {
  return signature.split('|').filter(Boolean);
}

/**
 * Per-stage CRM board loader: Active/Closed enforced via `status` query,
 * initial page = {@link CRM_KANBAN_COLUMN_PAGE_SIZE}, more via {@link loadMoreColumn}.
 */
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

  const [buckets, setBuckets] = useState<Record<string, StageBucket<T>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const bucketsRef = useRef(buckets);
  bucketsRef.current = buckets;

  const stageKeySignature = stageKeys.join('|');

  const reload = useCallback(async () => {
    if (!enabled) {
      setBuckets({});
      setLoading(false);
      setError(null);
      return;
    }

    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    setError(null);

    try {
      const keys = parseStageKeys(stageKeySignature);
      const pages = await Promise.all(
        keys.map(async (status) => {
          const data = await fetchPage({
            page: 1,
            pageSize: CRM_KANBAN_COLUMN_PAGE_SIZE,
            status,
            search: search || undefined,
            type: type || undefined,
            source: source || undefined,
            scope: listScope,
          });
          return { status, data };
        }),
      );

      if (generation !== fetchGenerationRef.current) return;

      const next: Record<string, StageBucket<T>> = {};
      for (const { status, data } of pages) {
        next[status] = {
          items: data.items,
          page: data.meta.page,
          total: data.meta.total,
          totalPages: data.meta.totalPages,
          loadingMore: false,
        };
      }
      setBuckets(next);
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setError('Could not load board columns. Check your connection and try again.');
      setBuckets({});
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, fetchPage, listScope, search, source, stageKeySignature, type]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadMoreColumn = useCallback(
    async (status: string) => {
      const current = bucketsRef.current[status] ?? emptyBucket<T>();
      if (!enabled || current.loadingMore) return;
      if (current.page >= current.totalPages || current.items.length >= current.total) return;

      const nextPage = current.page + 1;
      setBuckets((prev) => ({
        ...prev,
        [status]: { ...(prev[status] ?? emptyBucket<T>()), loadingMore: true },
      }));

      try {
        const data = await fetchPage({
          page: nextPage,
          pageSize: CRM_KANBAN_COLUMN_PAGE_SIZE,
          status,
          search: search || undefined,
          type: type || undefined,
          source: source || undefined,
          scope: listScope,
        });
        setBuckets((prev) => {
          const prior = prev[status] ?? emptyBucket<T>();
          return {
            ...prev,
            [status]: {
              items: mergeUniqueById(prior.items, data.items),
              page: data.meta.page,
              total: data.meta.total,
              totalPages: data.meta.totalPages,
              loadingMore: false,
            },
          };
        });
      } catch {
        setBuckets((prev) => ({
          ...prev,
          [status]: { ...(prev[status] ?? emptyBucket<T>()), loadingMore: false },
        }));
      }
    },
    [enabled, fetchPage, listScope, search, source, type],
  );

  const loadMoreAll = useCallback(() => {
    for (const status of parseStageKeys(stageKeySignature)) {
      const bucket = bucketsRef.current[status];
      if (!bucket) continue;
      if (bucket.page < bucket.totalPages && bucket.items.length < bucket.total) {
        void loadMoreColumn(status);
      }
    }
  }, [loadMoreColumn, stageKeySignature]);

  const items = useMemo(() => {
    const keys = parseStageKeys(stageKeySignature);
    return keys.flatMap((status) => buckets[status]?.items ?? []);
  }, [buckets, stageKeySignature]);

  const columnMeta = useMemo(() => {
    const meta: Record<string, CrmStageColumnMeta> = {};
    for (const status of parseStageKeys(stageKeySignature)) {
      const bucket = buckets[status] ?? emptyBucket<T>();
      meta[status] = {
        totalCount: bucket.total,
        hasMore: bucket.page < bucket.totalPages && bucket.items.length < bucket.total,
        loadingMore: bucket.loadingMore,
      };
    }
    return meta;
  }, [buckets, stageKeySignature]);

  const hasMoreAny = useMemo(
    () => Object.values(columnMeta).some((row) => row.hasMore),
    [columnMeta],
  );

  const setItems = useCallback((updater: (prev: T[]) => T[]) => {
    setBuckets((prev) => {
      const flat = Object.values(prev).flatMap((bucket) => bucket.items);
      const nextFlat = updater(flat);
      const byId = new Map(nextFlat.map((row) => [row.id, row]));
      const next: Record<string, StageBucket<T>> = {};

      for (const [status, bucket] of Object.entries(prev)) {
        const kept = bucket.items
          .map((row) => byId.get(row.id))
          .filter((row): row is T => row != null && row.status === status);
        for (const row of nextFlat) {
          if (row.status !== status) continue;
          if (kept.some((item) => item.id === row.id)) continue;
          kept.unshift(row);
        }
        next[status] = { ...bucket, items: kept };
      }

      for (const row of nextFlat) {
        if (next[row.status]) continue;
        next[row.status] = {
          ...emptyBucket<T>(),
          items: [row],
          page: 1,
          total: 1,
          totalPages: 1,
        };
      }

      return next;
    });
  }, []);

  const upsertItem = useCallback((item: T) => {
    setBuckets((prev) => {
      const next: Record<string, StageBucket<T>> = {};
      for (const [status, bucket] of Object.entries(prev)) {
        next[status] = {
          ...bucket,
          items: bucket.items.filter((row) => row.id !== item.id),
        };
      }
      const target = next[item.status] ?? emptyBucket<T>();
      const without = target.items.filter((row) => row.id !== item.id);
      next[item.status] = {
        ...target,
        items: [item, ...without],
        total: without.length === target.items.length ? target.total + 1 : target.total,
        totalPages: Math.max(target.totalPages, 1),
        page: Math.max(target.page, 1),
      };
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setBuckets((prev) => {
      const next: Record<string, StageBucket<T>> = {};
      for (const [status, bucket] of Object.entries(prev)) {
        const items = bucket.items.filter((row) => row.id !== id);
        const removed = items.length !== bucket.items.length;
        next[status] = {
          ...bucket,
          items,
          total: removed ? Math.max(0, bucket.total - 1) : bucket.total,
        };
      }
      return next;
    });
  }, []);

  return {
    items,
    columnMeta,
    hasMoreAny,
    loading,
    error,
    reload,
    loadMoreColumn,
    loadMoreAll,
    setItems,
    upsertItem,
    removeItem,
  };
}
