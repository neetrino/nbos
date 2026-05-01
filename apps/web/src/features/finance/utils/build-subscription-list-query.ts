import type { FinanceDateRangeParams } from '@/lib/api/finance-common';
import type { SubscriptionListParams } from '@/lib/api/subscriptions';

function resolveSubscriptionPartnerId(params: {
  filters: Record<string, string>;
  partnerIdFromUrl: string | null;
}): string | undefined {
  const partnerRaw = params.filters.partner;
  const partnerFromFilter = partnerRaw && partnerRaw !== 'all' ? partnerRaw : undefined;
  const fromUrl = params.partnerIdFromUrl?.trim();
  return partnerFromFilter ?? (fromUrl ? fromUrl : undefined);
}

/**
 * Query shape for `GET /api/finance/subscriptions` (excluding paging).
 * Shared by the subscriptions page fetch and CSV export paging.
 */
export function buildSubscriptionListApiParams(
  params: {
    search: string;
    filters: Record<string, string>;
    partnerIdFromUrl: string | null;
  },
  periodParams?: FinanceDateRangeParams,
): Omit<SubscriptionListParams, 'page' | 'pageSize'> {
  return {
    search: params.search || undefined,
    type: params.filters.type && params.filters.type !== 'all' ? params.filters.type : undefined,
    status:
      params.filters.status && params.filters.status !== 'all' ? params.filters.status : undefined,
    partnerId: resolveSubscriptionPartnerId(params),
    ...periodParams,
  };
}

export function buildSubscriptionListQuery(
  params: {
    search: string;
    filters: Record<string, string>;
    partnerIdFromUrl: string | null;
  },
  periodParams?: FinanceDateRangeParams,
) {
  return {
    ...buildSubscriptionListApiParams(params, periodParams),
    pageSize: 100,
  };
}
