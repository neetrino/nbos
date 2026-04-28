import { subscriptionMatchesPartnerStatsScope } from '@/features/finance/utils/subscription-partner-stats-scope';
import type { Subscription, SubscriptionStats } from '@/lib/api/finance';

export function replaceSubscription(subscriptions: Subscription[], updated: Subscription) {
  return subscriptions.map((subscription) =>
    subscription.id === updated.id ? { ...subscription, ...updated } : subscription,
  );
}

export function applyOptimisticSubscriptionStats(
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
