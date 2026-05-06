import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildSubscriptionGridQueryParams } from '@/features/finance/utils/build-subscription-list-query';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type SubscriptionGridPayload } from '@/lib/api/finance';

interface UseSubscriptionGridParams {
  year: number;
  search: string;
  filters: Record<string, string>;
  partnerIdFromUrl: string | null;
}

export function useSubscriptionGrid(params: UseSubscriptionGridParams) {
  const [data, setData] = useState<SubscriptionGridPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () =>
      buildSubscriptionGridQueryParams({
        year: params.year,
        search: params.search,
        filters: params.filters,
        partnerIdFromUrl: params.partnerIdFromUrl,
      }),
    [params.year, params.search, params.filters, params.partnerIdFromUrl],
  );

  const fetchGrid = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await subscriptionsApi.getGrid(query);
      setData(payload);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Subscription grid could not be loaded. Check your connection and try again.',
        ),
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchGrid();
  }, [fetchGrid]);

  return { data, loading, error, retry: fetchGrid };
}
