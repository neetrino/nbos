import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { ReportFilterState } from '../report-filters';
import { buildReportFilters } from '../report-filters';

export interface LazyReportTabState<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  loadedAt: Date | null;
  refresh: () => void;
}

export function useLazyReportTabData<TData>(
  enabled: boolean,
  filters: ReportFilterState,
  loader: (filters: Record<string, string>) => Promise<TData>,
  errorMessage: string,
): LazyReportTabState<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [loadedFilterKey, setLoadedFilterKey] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const reportFilters = useMemo(() => buildReportFilters(filters), [filters]);
  const filterKey = useMemo(() => JSON.stringify(reportFilters), [reportFilters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextData = await loader(reportFilters);
      setData(nextData);
      setLoadedAt(new Date());
      setLoadedFilterKey(filterKey);
    } catch (caught) {
      setError(getApiErrorMessage(caught, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [errorMessage, filterKey, loader, reportFilters]);

  useEffect(() => {
    if (!enabled) return;
    const shouldReload = loadedFilterKey !== filterKey || refreshToken > 0;
    if (!shouldReload) return;
    void load();
  }, [enabled, filterKey, load, loadedFilterKey, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (refreshToken === 0 || loading) return;
    setRefreshToken(0);
  }, [loading, refreshToken]);

  return { data, loading, error, loadedAt, refresh };
}
