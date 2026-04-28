import type { FinanceDateRangeParams } from '@/lib/api/finance-common';

export function buildSubscriptionListQuery(
  params: {
    search: string;
    filters: Record<string, string>;
    partnerIdFromUrl: string | null;
  },
  periodParams?: FinanceDateRangeParams,
) {
  const partnerRaw = params.filters.partner;
  const partnerFromFilter = partnerRaw && partnerRaw !== 'all' ? partnerRaw : undefined;
  const fromUrl = params.partnerIdFromUrl?.trim();
  const partnerId = partnerFromFilter ?? (fromUrl ? fromUrl : undefined);

  return {
    pageSize: 100,
    search: params.search || undefined,
    type: params.filters.type && params.filters.type !== 'all' ? params.filters.type : undefined,
    status:
      params.filters.status && params.filters.status !== 'all' ? params.filters.status : undefined,
    partnerId,
    ...periodParams,
  };
}
