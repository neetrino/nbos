import { getFinancePeriodParams, type FinancePeriod } from '../constants/finance';
import { subscriptionsApi, type SubscriptionStats } from '../../../lib/api/finance';
import type { SubscriptionStatsQueryParams } from '../../../lib/api/subscriptions';
import { buildSubscriptionListQuery } from './build-subscription-list-query';

/** Shared list + stats query shapes for the subscriptions page (partner scope parity). */
export function buildSubscriptionPageQueries(
  params: {
    search: string;
    filters: Record<string, string>;
    partnerIdFromUrl: string | null;
  },
  period: FinancePeriod,
) {
  const periodParams = getFinancePeriodParams(period);
  const listQuery = buildSubscriptionListQuery(params, periodParams);
  const statsParams: SubscriptionStatsQueryParams = {
    ...periodParams,
    ...(listQuery.partnerId !== undefined ? { partnerId: listQuery.partnerId } : {}),
  };
  return { listQuery, statsParams };
}

export async function fetchSubscriptionPageStats(input: {
  search: string;
  filters: Record<string, string>;
  partnerIdFromUrl: string | null;
  period: FinancePeriod;
}): Promise<SubscriptionStats> {
  const { statsParams } = buildSubscriptionPageQueries(input, input.period);
  return subscriptionsApi.getStats(statsParams);
}
