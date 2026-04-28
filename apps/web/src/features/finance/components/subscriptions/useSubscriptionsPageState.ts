import { useCallback, useEffect, useState } from 'react';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { subscriptionsApi, type Subscription, type SubscriptionStats } from '@/lib/api/finance';
import type { FinanceDateRangeParams } from '@/lib/api/finance-common';

export function useSubscriptionsPageState() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useInitialSearch();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchSubscriptions = useSubscriptionFetch({
    search,
    filters,
    period,
    setSubscriptions,
    setStats,
    setLoading,
    setError,
  });

  const handleActivate = useSubscriptionActivation(
    setSubscriptions,
    setStats,
    setError,
    setActivatingId,
  );

  const handleCancel = useSubscriptionCancellation(
    setSubscriptions,
    setStats,
    setError,
    setCancellingId,
  );

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    stats,
    loading,
    error,
    search,
    setSearch,
    activatingId,
    cancellingId,
    filters,
    setFilters,
    period,
    setPeriod,
    fetchSubscriptions,
    handleActivate,
    handleCancel,
  };
}

function useInitialSearch() {
  return useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('search') ?? '';
  });
}

function useSubscriptionFetch({
  search,
  filters,
  period,
  setSubscriptions,
  setStats,
  setLoading,
  setError,
}: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  setStats: (stats: SubscriptionStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}) {
  return useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, subscriptionStats] = await Promise.all([
        subscriptionsApi.getAll(buildSubscriptionQuery({ filters, search }, periodParams)),
        subscriptionsApi.getStats(periodParams),
      ]);
      setSubscriptions(data.items);
      setStats(subscriptionStats);
      setError(null);
    } catch {
      setError('Subscriptions could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, period, search, setError, setLoading, setStats, setSubscriptions]);
}

function buildSubscriptionQuery(
  params: { search: string; filters: Record<string, string> },
  periodParams?: FinanceDateRangeParams,
) {
  return {
    pageSize: 100,
    search: params.search || undefined,
    type: params.filters.type && params.filters.type !== 'all' ? params.filters.type : undefined,
    status:
      params.filters.status && params.filters.status !== 'all' ? params.filters.status : undefined,
    ...periodParams,
  };
}

function useSubscriptionActivation(
  setSubscriptions: (updater: (current: Subscription[]) => Subscription[]) => void,
  setStats: (updater: (current: SubscriptionStats | null) => SubscriptionStats | null) => void,
  setError: (error: string | null) => void,
  setActivatingId: (id: string | null) => void,
) {
  return useCallback(
    async (subscription: Subscription) => {
      setActivatingId(subscription.id);
      try {
        const updated = await subscriptionsApi.updateStatus(subscription.id, 'ACTIVE');
        setSubscriptions((current) => replaceSubscription(current, updated));
        setStats((current) =>
          applyOptimisticSubscriptionStats(current, 'PENDING', 'ACTIVE', Number(updated.amount)),
        );
        setError(null);
      } catch {
        setError('Subscription could not be activated. Check the subscription and try again.');
      } finally {
        setActivatingId(null);
      }
    },
    [setActivatingId, setError, setStats, setSubscriptions],
  );
}

function replaceSubscription(subscriptions: Subscription[], updated: Subscription) {
  return subscriptions.map((subscription) =>
    subscription.id === updated.id ? { ...subscription, ...updated } : subscription,
  );
}

function applyOptimisticSubscriptionStats(
  stats: SubscriptionStats | null,
  from: string,
  to: string,
  amount: number,
): SubscriptionStats | null {
  if (!stats) return stats;

  const mrr = Number(stats.monthlyRevenue ?? 0);
  if (from === 'PENDING' && to === 'ACTIVE') {
    return {
      ...stats,
      activeSubscriptions: stats.activeSubscriptions + 1,
      monthlyRevenue: mrr + amount,
    };
  }
  if (from === 'ACTIVE' && to === 'CANCELLED') {
    return {
      ...stats,
      activeSubscriptions: Math.max(0, stats.activeSubscriptions - 1),
      monthlyRevenue: Math.max(0, mrr - amount),
    };
  }
  return stats;
}

function useSubscriptionCancellation(
  setSubscriptions: (updater: (current: Subscription[]) => Subscription[]) => void,
  setStats: (updater: (current: SubscriptionStats | null) => SubscriptionStats | null) => void,
  setError: (error: string | null) => void,
  setCancellingId: (id: string | null) => void,
) {
  return useCallback(
    async (subscription: Subscription) => {
      setCancellingId(subscription.id);
      try {
        const updated = await subscriptionsApi.updateStatus(subscription.id, 'CANCELLED');
        setSubscriptions((current) => replaceSubscription(current, updated));
        setStats((current) =>
          applyOptimisticSubscriptionStats(
            current,
            subscription.status,
            'CANCELLED',
            Number(subscription.amount),
          ),
        );
        setError(null);
      } catch {
        setError('Subscription could not be cancelled. Try again.');
        throw new Error('subscription_cancel_failed');
      } finally {
        setCancellingId(null);
      }
    },
    [setCancellingId, setError, setStats, setSubscriptions],
  );
}
