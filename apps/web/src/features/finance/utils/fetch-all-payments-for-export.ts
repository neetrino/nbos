import { paymentsApi } from '@/lib/api/finance';
import type { Payment, PaymentListParams } from '@/lib/api/finance';

const PAYMENT_EXPORT_PAGE_CHUNK_SIZE = 500;

const PAYMENT_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every payment row matching the given list filters by paging through `GET /api/finance/payments`.
 */
export async function fetchAllPaymentsForExport(
  params: Omit<PaymentListParams, 'page' | 'pageSize'>,
): Promise<Payment[]> {
  const aggregated: Payment[] = [];
  let page = 1;
  while (aggregated.length < PAYMENT_EXPORT_ROW_HARD_CAP) {
    const data = await paymentsApi.getAll({
      ...params,
      page,
      pageSize: PAYMENT_EXPORT_PAGE_CHUNK_SIZE,
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
