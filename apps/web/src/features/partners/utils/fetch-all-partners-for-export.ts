import { partnersApi, type Partner, type PartnerListParams } from '@/lib/api/partners';

const PARTNER_EXPORT_PAGE_CHUNK_SIZE = 500;

const PARTNER_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every partner row matching the given list filters by paging through `GET /api/partners`.
 */
export async function fetchAllPartnersForExport(
  params: Omit<PartnerListParams, 'page' | 'pageSize'>,
): Promise<Partner[]> {
  const aggregated: Partner[] = [];
  let page = 1;
  while (aggregated.length < PARTNER_EXPORT_ROW_HARD_CAP) {
    const data = await partnersApi.getAll({
      ...params,
      page,
      pageSize: PARTNER_EXPORT_PAGE_CHUNK_SIZE,
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
