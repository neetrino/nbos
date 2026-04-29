import { invoicesApi } from '@/lib/api/finance';
import type { Invoice, InvoiceListParams } from '@/lib/api/finance';

const INVOICE_EXPORT_PAGE_CHUNK_SIZE = 500;

const INVOICE_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every invoice row matching the given list filters by paging through `GET /api/finance/invoices`.
 */
export async function fetchAllInvoicesForExport(
  params: Omit<InvoiceListParams, 'page' | 'pageSize'>,
): Promise<Invoice[]> {
  const aggregated: Invoice[] = [];
  let page = 1;
  while (aggregated.length < INVOICE_EXPORT_ROW_HARD_CAP) {
    const data = await invoicesApi.getAll({
      ...params,
      page,
      pageSize: INVOICE_EXPORT_PAGE_CHUNK_SIZE,
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
