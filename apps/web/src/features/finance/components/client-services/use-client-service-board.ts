'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  clientServicesApi,
  type ClientServiceBoardPayload,
  type ClientServiceBoardView,
  type ClientServiceRecordListParams,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';

const BOARD_PAGE_SIZE = 20;

interface UseClientServiceBoardOptions {
  view: ClientServiceBoardView;
  baseParams: ClientServiceRecordListParams;
  year: number;
  reloadToken: number;
}

interface UseClientServiceBoardResult {
  board: ClientServiceBoardPayload | null;
  loading: boolean;
  error: string | null;
}

export function useClientServiceBoard({
  view,
  baseParams,
  year,
  reloadToken,
}: UseClientServiceBoardOptions): UseClientServiceBoardResult {
  const [board, setBoard] = useState<ClientServiceBoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchKey = useMemo(
    () => JSON.stringify({ view, baseParams, year, reloadToken }),
    [view, baseParams, year, reloadToken],
  );
  const [trackedFetchKey, setTrackedFetchKey] = useState(fetchKey);

  if (trackedFetchKey !== fetchKey) {
    setTrackedFetchKey(fetchKey);
    setLoading(true);
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    void clientServicesApi
      .getBoard({ view, year, pageSize: BOARD_PAGE_SIZE, ...baseParams })
      .then((payload) => {
        if (requestId !== requestIdRef.current) return;
        setBoard(payload);
        setError(null);
      })
      .catch((caught) => {
        if (requestId !== requestIdRef.current) return;
        setBoard(null);
        setError(getApiErrorMessage(caught, 'Client services board could not be loaded.'));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [fetchKey, view, baseParams, year]);

  return { board, loading, error };
}
