'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type ClientServiceRecordListParams,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';

const DEFAULT_PAGE_SIZE = 20;

export interface ClientServiceListSeed {
  items: ClientServiceRecord[];
  total: number;
}

interface UseClientServiceListResult {
  items: ClientServiceRecord[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Server-paginated client services loader with append-on-scroll semantics.
 * Resets and refetches page 1 whenever the filter params change; `loadMore`
 * appends the next page. A monotonic request id guards against out-of-order responses.
 */
export function useClientServiceList(
  params: ClientServiceRecordListParams,
  pageSize: number = DEFAULT_PAGE_SIZE,
  reloadToken: number = 0,
  seed?: ClientServiceListSeed | null,
): UseClientServiceListResult {
  const [items, setItems] = useState<ClientServiceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      const requestId = ++requestIdRef.current;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const parsed = JSON.parse(paramsKey) as ClientServiceRecordListParams;
        const data = await clientServicesApi.getAll({ ...parsed, page: nextPage, pageSize });
        if (requestId !== requestIdRef.current) return;
        setTotal(data.meta.total);
        setPage(nextPage);
        setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
        setError(null);
      } catch (caught) {
        if (requestId !== requestIdRef.current) return;
        setError(getApiErrorMessage(caught, 'Client services could not be loaded.'));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [paramsKey, pageSize],
  );

  useEffect(() => {
    if (seed) {
      setItems(seed.items);
      setTotal(seed.total);
      setPage(1);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      return;
    }
    void fetchPage(1);
  }, [fetchPage, reloadToken, seed]);

  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    void fetchPage(page + 1);
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  return { items, loading, loadingMore, error, hasMore, loadMore };
}
