import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import type { InvoiceListParams } from '@/lib/api/finance';

export interface BuildInvoiceListApiParamsInput {
  search: string;
  filters: Record<string, string>;
  subscriptionIdFromUrl: string | null;
  period: FinancePeriod;
}

/**
 * Query shape for `GET /api/finance/invoices` (excluding paging).
 * Shared by the invoices page fetch and CSV export paging.
 */
export function buildInvoiceListApiParams(
  input: BuildInvoiceListApiParamsInput,
): Omit<InvoiceListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  return {
    search: input.search || undefined,
    status:
      input.filters.status && input.filters.status !== 'all' ? input.filters.status : undefined,
    type: input.filters.type && input.filters.type !== 'all' ? input.filters.type : undefined,
    subscriptionId: input.subscriptionIdFromUrl || undefined,
    ...periodParams,
  };
}
