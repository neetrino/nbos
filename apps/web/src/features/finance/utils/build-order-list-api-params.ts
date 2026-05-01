import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import type { OrderListParams, OrderReconciliationListGap } from '@/lib/api/finance';

export interface BuildOrderListApiParamsInput {
  search: string;
  filters: Record<string, string>;
  partnerIdFromUrl: string | null;
  period: FinancePeriod;
  gap: OrderReconciliationListGap | null;
}

/**
 * Query shape for `GET /api/finance/orders` (excluding paging).
 * Shared by the orders page fetch and CSV export paging.
 */
export function buildOrderListApiParams(
  input: BuildOrderListApiParamsInput,
): Omit<OrderListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  const statusFilter =
    input.filters.status && input.filters.status !== 'all' ? input.filters.status : undefined;
  return {
    search: input.search || undefined,
    status: statusFilter,
    ...(input.partnerIdFromUrl ? { partnerId: input.partnerIdFromUrl } : {}),
    ...(input.gap ? { gap: input.gap } : {}),
    ...(periodParams ?? {}),
  };
}
