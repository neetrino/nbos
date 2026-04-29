import { ordersApi } from '@/lib/api/finance';
import type { Order, OrderListParams } from '@/lib/api/finance';

const ORDER_EXPORT_PAGE_CHUNK_SIZE = 500;

const ORDER_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every order row matching the given list filters by paging through `GET /api/finance/orders`.
 */
export async function fetchAllOrdersForExport(
  params: Omit<OrderListParams, 'page' | 'pageSize'>,
): Promise<Order[]> {
  const aggregated: Order[] = [];
  let page = 1;
  while (aggregated.length < ORDER_EXPORT_ROW_HARD_CAP) {
    const data = await ordersApi.getAll({
      ...params,
      page,
      pageSize: ORDER_EXPORT_PAGE_CHUNK_SIZE,
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
