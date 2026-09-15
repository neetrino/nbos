'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { callsApi, type CallActivity } from '@/lib/api/calls';
import { CALL_ACTIVITIES_LOAD_FAILED_KEY } from './use-call-activities';
import { CALL_JOURNAL_PAGE_SIZE, journalHasMorePages } from './call-journal-page';

export function useWorkspaceCallActivities() {
  const [items, setItems] = useState<CallActivity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void callsApi
      .listJournal({ page: 1, pageSize: CALL_JOURNAL_PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setPage(1);
        setTotal(data.meta.total);
        setHasMore(journalHasMorePages(data.meta));
        setErrorKey(null);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setHasMore(false);
        setTotal(null);
        setErrorKey(CALL_ACTIVITIES_LOAD_FAILED_KEY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    void callsApi
      .listJournal({ page: nextPage, pageSize: CALL_JOURNAL_PAGE_SIZE })
      .then((data) => {
        setItems((current) => [...current, ...data.items]);
        setPage(nextPage);
        setHasMore(journalHasMorePages(data.meta));
        setErrorKey(null);
      })
      .catch(() => setErrorKey(CALL_ACTIVITIES_LOAD_FAILED_KEY))
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [hasMore, page]);

  return { items, total, loading, errorKey, hasMore, loadMore, loadingMore };
}
