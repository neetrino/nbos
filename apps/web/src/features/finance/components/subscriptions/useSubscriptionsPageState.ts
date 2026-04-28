import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { buildSubscriptionListQuery } from '@/features/finance/utils/build-subscription-list-query';
import { subscriptionMatchesPartnerStatsScope } from '@/features/finance/utils/subscription-partner-stats-scope';
import { subscriptionsApi, type Subscription, type SubscriptionStats } from '@/lib/api/finance';

interface UseSubscriptionsPageStateOptions {
  partnerIdFromUrl?: string | null;
}

export function useSubscriptionsPageState(options?: UseSubscriptionsPageStateOptions) {
  const partnerIdFromUrl = options?.partnerIdFromUrl?.trim() || null;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useInitialSearch();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const filtersForBar = useMemo(() => {
    const pid = partnerIdFromUrl?.trim();
    if (!pid) return filters;
    const current = filters.partner;
    if (current && current !== 'all') return filters;
    return { ...filters, partner: pid };
  }, [filters, partnerIdFromUrl]);

  const statsPartnerScope = useMemo(
    () => buildSubscriptionListQuery({ filters, search, partnerIdFromUrl }).partnerId,
    [filters, search, partnerIdFromUrl],
  );

  const fetchSubscriptions = useSubscriptionFetch({
    search,
    filters,
    partnerIdFromUrl,
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
    statsPartnerScope,
  );

  const handleCancel = useSubscriptionCancellation(
    setSubscriptions,
    setStats,
    setError,
    setCancellingId,
    statsPartnerScope,
  );

  const handleHold = useSubscriptionHold(
    setSubscriptions,
    setStats,
    setError,
    setHoldingId,
    statsPartnerScope,
  );

  const handlePartnerLinked = useCallback(
    (updated: Subscription) => {
      setSubscriptions((current) => replaceSubscription(current, updated));
      setError(null);
    },
    [setSubscriptions, setError],
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
    holdingId,
    filters,
    filtersForBar,
    setFilters,
    period,
    setPeriod,
    fetchSubscriptions,
    handleActivate,
    handleCancel,
    handleHold,
    handlePartnerLinked,
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
  partnerIdFromUrl,
  period,
  setSubscriptions,
  setStats,
  setLoading,
  setError,
}: {
  search: string;
  filters: Record<string, string>;
  partnerIdFromUrl: string | null;
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
      const listQuery = buildSubscriptionListQuery(
        { filters, search, partnerIdFromUrl },
        periodParams,
      );
      const [data, subscriptionStats] = await Promise.all([
        subscriptionsApi.getAll(listQuery),
        subscriptionsApi.getStats({
          ...periodParams,
          ...(listQuery.partnerId !== undefined ? { partnerId: listQuery.partnerId } : {}),
        }),
      ]);
      setSubscriptions(data.items);
      setStats(subscriptionStats);
      setError(null);
    } catch {
      setError('Subscriptions could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, partnerIdFromUrl, period, search, setError, setLoading, setStats, setSubscriptions]);
}

function useSubscriptionActivation(
  setSubscriptions: (updater: (current: Subscription[]) => Subscription[]) => void,
  setStats: (updater: (current: SubscriptionStats | null) => SubscriptionStats | null) => void,
  setError: (error: string | null) => void,
  setActivatingId: (id: string | null) => void,
  statsPartnerScope: string | undefined,
) {
  return useCallback(
    async (subscription: Subscription) => {
      setActivatingId(subscription.id);
      try {
        const updated = await subscriptionsApi.updateStatus(subscription.id, 'ACTIVE');
        setSubscriptions((current) => replaceSubscription(current, updated));
        setStats((current) =>
          applyOptimisticSubscriptionStats(
            current,
            subscription,
            statsPartnerScope,
            subscription.status,
            'ACTIVE',
            Number(updated.amount),
          ),
        );
        setError(null);
      } catch {
        setError('Subscription could not be activated or resumed. Try again.');
      } finally {
        setActivatingId(null);
      }
    },
    [setActivatingId, setError, setStats, setSubscriptions, statsPartnerScope],
  );
}

function replaceSubscription(subscriptions: Subscription[], updated: Subscription) {
  return subscriptions.map((subscription) =>
    subscription.id === updated.id ? { ...subscription, ...updated } : subscription,
  );
}

function applyOptimisticSubscriptionStats(
  stats: SubscriptionStats | null,
  subscription: Subscription,
  statsPartnerScope: string | undefined,
  from: string,
  to: string,
  amount: number,
): SubscriptionStats | null {
  if (!stats) return stats;
  if (!subscriptionMatchesPartnerStatsScope(subscription, statsPartnerScope)) {
    return stats;
  }

  const mrr = Number(stats.monthlyRevenue ?? 0);
  if ((from === 'PENDING' || from === 'ON_HOLD') && to === 'ACTIVE') {
    return {
      ...stats,
      activeSubscriptions: stats.activeSubscriptions + 1,
      monthlyRevenue: mrr + amount,
    };
  }
  if (from === 'ACTIVE' && (to === 'CANCELLED' || to === 'ON_HOLD')) {
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
  statsPartnerScope: string | undefined,
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
            subscription,
            statsPartnerScope,
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
    [setCancellingId, setError, setStats, setSubscriptions, statsPartnerScope],
  );
}

function useSubscriptionHold(
  setSubscriptions: (updater: (current: Subscription[]) => Subscription[]) => void,
  setStats: (updater: (current: SubscriptionStats | null) => SubscriptionStats | null) => void,
  setError: (error: string | null) => void,
  setHoldingId: (id: string | null) => void,
  statsPartnerScope: string | undefined,
) {
  return useCallback(
    async (subscription: Subscription) => {
      setHoldingId(subscription.id);
      try {
        const updated = await subscriptionsApi.updateStatus(subscription.id, 'ON_HOLD');
        setSubscriptions((current) => replaceSubscription(current, updated));
        setStats((current) =>
          applyOptimisticSubscriptionStats(
            current,
            subscription,
            statsPartnerScope,
            'ACTIVE',
            'ON_HOLD',
            Number(subscription.amount),
          ),
        );
        setError(null);
      } catch {
        setError('Subscription could not be put on hold. Try again.');
        throw new Error('subscription_hold_failed');
      } finally {
        setHoldingId(null);
      }
    },
    [setError, setHoldingId, setStats, setSubscriptions, statsPartnerScope],
  );
}
