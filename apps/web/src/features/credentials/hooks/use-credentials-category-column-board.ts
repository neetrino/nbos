'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export interface CredentialCategoryColumnPageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CredentialCategoryColumnMeta {
  totalCount: number;
  hasMore: boolean;
  loadingMore: boolean;
}

interface ColumnBucket {
  items: CredentialListItem[];
  page: number;
  total: number;
  totalPages: number;
  loadingMore: boolean;
}

function emptyBucket(): ColumnBucket {
  return { items: [], page: 0, total: 0, totalPages: 0, loadingMore: false };
}

function mergeUniqueById(
  existing: CredentialListItem[],
  incoming: CredentialListItem[],
): CredentialListItem[] {
  const seen = new Set(existing.map((row) => row.id));
  const next = [...existing];
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    next.push(row);
  }
  return next;
}

function parseColumnKeys(signature: string): string[] {
  return signature.split('|').filter(Boolean);
}

function hasMoreInBucket(bucket: ColumnBucket): boolean {
  return bucket.page < bucket.totalPages && bucket.items.length < bucket.total;
}

/**
 * Per-category vault board: first page per column in parallel, more on that column's scroll.
 */
export function useCredentialsCategoryColumnBoard(options: {
  enabled: boolean;
  columnKeys: readonly string[];
  pageSize: number;
  queryKey: string;
  fetchPage: (params: {
    page: number;
    pageSize: number;
    columnKey: string;
  }) => Promise<{ items: CredentialListItem[]; meta: CredentialCategoryColumnPageMeta }>;
}) {
  const { enabled, columnKeys, pageSize, queryKey, fetchPage } = options;
  const [buckets, setBuckets] = useState<Record<string, ColumnBucket>>({});
  const [loading, setLoading] = useState(true);
  const fetchGenerationRef = useRef(0);
  const bucketsRef = useRef(buckets);
  bucketsRef.current = buckets;

  const columnKeySignature = columnKeys.join('|');

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        setBuckets({});
        setLoading(true);
        return;
      }

      const generation = ++fetchGenerationRef.current;
      const keys = parseColumnKeys(columnKeySignature);
      const hasSameColumns = keys.length > 0 && keys.every((key) => bucketsRef.current[key]);
      if (!options?.silent && !hasSameColumns) setLoading(true);

      try {
        const pages = await Promise.all(
          keys.map(async (columnKey) => {
            const data = await fetchPage({ page: 1, pageSize, columnKey });
            return { columnKey, data };
          }),
        );
        if (generation !== fetchGenerationRef.current) return;

        const next: Record<string, ColumnBucket> = {};
        for (const { columnKey, data } of pages) {
          next[columnKey] = {
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
        setBuckets({});
      } finally {
        if (generation === fetchGenerationRef.current) setLoading(false);
      }
    },
    [columnKeySignature, enabled, fetchPage, pageSize],
  );

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, queryKey, reload]);

  useEffect(() => {
    if (enabled) return;
    setBuckets({});
    setLoading(true);
  }, [enabled]);

  const loadMoreColumn = useCallback(
    async (columnKey: string) => {
      const current = bucketsRef.current[columnKey] ?? emptyBucket();
      if (!enabled || current.loadingMore || !hasMoreInBucket(current)) return;

      const nextPage = current.page + 1;
      setBuckets((prev) => ({
        ...prev,
        [columnKey]: { ...(prev[columnKey] ?? emptyBucket()), loadingMore: true },
      }));

      try {
        const data = await fetchPage({ page: nextPage, pageSize, columnKey });
        setBuckets((prev) => {
          const prior = prev[columnKey] ?? emptyBucket();
          return {
            ...prev,
            [columnKey]: {
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
          [columnKey]: { ...(prev[columnKey] ?? emptyBucket()), loadingMore: false },
        }));
      }
    },
    [enabled, fetchPage, pageSize],
  );

  const items = useMemo(() => {
    return parseColumnKeys(columnKeySignature).flatMap((key) => buckets[key]?.items ?? []);
  }, [buckets, columnKeySignature]);

  const columnMeta = useMemo(() => {
    const meta: Record<string, CredentialCategoryColumnMeta> = {};
    for (const key of parseColumnKeys(columnKeySignature)) {
      const bucket = buckets[key] ?? emptyBucket();
      meta[key] = {
        totalCount: bucket.total,
        hasMore: hasMoreInBucket(bucket),
        loadingMore: bucket.loadingMore,
      };
    }
    return meta;
  }, [buckets, columnKeySignature]);

  const total = useMemo(
    () =>
      parseColumnKeys(columnKeySignature).reduce((sum, key) => sum + (buckets[key]?.total ?? 0), 0),
    [buckets, columnKeySignature],
  );

  const setItems = useCallback((updater: (prev: CredentialListItem[]) => CredentialListItem[]) => {
    setBuckets((prev) => {
      const keys = Object.keys(prev);
      const nextFlat = updater(keys.flatMap((key) => prev[key]?.items ?? []));
      const byId = new Map(nextFlat.map((row) => [row.id, row]));
      const next: Record<string, ColumnBucket> = {};
      for (const key of keys) {
        const bucket = prev[key] ?? emptyBucket();
        next[key] = {
          ...bucket,
          items: bucket.items
            .map((row) => byId.get(row.id))
            .filter((row): row is CredentialListItem => row != null),
        };
      }
      return next;
    });
  }, []);

  return { items, columnMeta, total, loading, reload, loadMoreColumn, setItems };
}
