'use client';

import { useCallback, useRef, useState } from 'react';
import {
  SEARCH_FIELD_SPINNER_DELAY_MS,
  searchFieldTypeDelayMs,
} from '@/components/shared/search-field-query';
import type { SearchOption } from '@/components/shared/search-field-option';

export function useSearchFieldQuery(
  onSearch: (query: string) => Promise<SearchOption[]>,
  maxResults: number,
) {
  const [results, setResults] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestIdRef = useRef(0);

  const cancelPending = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const runSearch = useCallback(
    (query: string) => {
      cancelPending();
      const start = () => {
        void executeSearch(
          query,
          onSearch,
          maxResults,
          requestIdRef,
          setResults,
          setHighlightIdx,
          setLoading,
        );
      };
      const delay = searchFieldTypeDelayMs(query);
      if (delay === 0) {
        start();
        return;
      }
      debounceRef.current = setTimeout(start, delay);
    },
    [cancelPending, maxResults, onSearch],
  );

  return {
    results,
    loading,
    highlightIdx,
    setHighlightIdx,
    runSearch,
    cancelPending,
  };
}

async function executeSearch(
  query: string,
  onSearch: (query: string) => Promise<SearchOption[]>,
  maxResults: number,
  requestIdRef: { current: number },
  setResults: (items: SearchOption[]) => void,
  setHighlightIdx: (index: number) => void,
  setLoading: (loading: boolean) => void,
): Promise<void> {
  const requestId = ++requestIdRef.current;
  const spinnerTimer = window.setTimeout(() => {
    if (requestId === requestIdRef.current) setLoading(true);
  }, SEARCH_FIELD_SPINNER_DELAY_MS);
  try {
    const items = await onSearch(query);
    if (requestId !== requestIdRef.current) return;
    setResults(items.slice(0, maxResults));
    setHighlightIdx(-1);
  } catch {
    if (requestId !== requestIdRef.current) return;
  } finally {
    window.clearTimeout(spinnerTimer);
    if (requestId === requestIdRef.current) setLoading(false);
  }
}
