import { subscriptionsApi } from '@/lib/api/finance';
import type { Subscription, SubscriptionListParams } from '@/lib/api/subscriptions';

const SUBSCRIPTION_EXPORT_PAGE_CHUNK_SIZE = 500;

const SUBSCRIPTION_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every subscription row matching the given list filters by paging through `GET /api/finance/subscriptions`.
 */
export async function fetchAllSubscriptionsForExport(
  params: Omit<SubscriptionListParams, 'page' | 'pageSize'>,
): Promise<Subscription[]> {
  const aggregated: Subscription[] = [];
  let page = 1;
  while (aggregated.length < SUBSCRIPTION_EXPORT_ROW_HARD_CAP) {
    const data = await subscriptionsApi.getAll({
      ...params,
      page,
      pageSize: SUBSCRIPTION_EXPORT_PAGE_CHUNK_SIZE,
    });
    aggregated.push(...data.items);
    const totalPages = Math.max(1, data.meta.totalPages);
    if (page >= totalPages || data.items.length === 0) {
      break;
    }
    page += 1;
  }
  return aggregated;
}
