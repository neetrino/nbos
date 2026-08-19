'use client';

import { useEffect, useRef, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@/components/shared/constants/search-debounce';
import { getApiErrorMessage } from '@/lib/api-errors';
import { searchApi, type GlobalSearchResponse, type SearchQueryGroup } from '@/lib/api/search';
import { GLOBAL_SEARCH_MIN_QUERY_LENGTH } from './global-search-constants';

interface UseGlobalSearchQueryOptions {
  open: boolean;
  query: string;
  group: SearchQueryGroup;
}

interface UseGlobalSearchQueryResult {
  loading: boolean;
  error: string | null;
  response: GlobalSearchResponse | null;
}

const IDLE_SEARCH_STATE: UseGlobalSearchQueryResult = {
  loading: false,
  error: null,
  response: null,
};

export function useGlobalSearchQuery({
  open,
  query,
  group,
}: UseGlobalSearchQueryOptions): UseGlobalSearchQueryResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GlobalSearchResponse | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    const shouldSearch = trimmed.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH;
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    const run = () => {
      if (shouldSearch) setLoading(true);
      setError(null);
      void searchApi
        .search({ q: trimmed || undefined, group, signal: controller.signal })
        .then((data) => {
          if (requestIdRef.current !== requestId) return;
          setResponse(data);
        })
        .catch((caught: unknown) => {
          if (requestIdRef.current !== requestId) return;
          if (caught instanceof DOMException && caught.name === 'AbortError') return;
          setError(getApiErrorMessage(caught, 'Search failed. Try again.'));
        })
        .finally(() => {
          if (requestIdRef.current === requestId && shouldSearch) {
            setLoading(false);
          }
        });
    };

    if (!shouldSearch) {
      run();
      return () => controller.abort();
    }

    const timer = window.setTimeout(run, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [group, open, query]);

  if (!open) {
    return IDLE_SEARCH_STATE;
  }

  return { loading, error, response };
}
