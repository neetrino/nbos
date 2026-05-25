import { fetchAllBonusListRows } from '@/lib/api/bonus';
import type { BonusEntryListRow } from '@/lib/api/bonus';

/** Loads bonus entries scoped to a product pool's order ids. */
export async function fetchBonusEntriesForPool(
  orderIds: readonly string[],
): Promise<BonusEntryListRow[]> {
  const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
  if (uniqueOrderIds.length === 0) return [];

  const orderIdSet = new Set(uniqueOrderIds);
  const combined: BonusEntryListRow[] = [];

  for (const orderId of uniqueOrderIds) {
    const rows = await fetchAllBonusListRows({ orderId });
    combined.push(...rows);
  }

  const seen = new Set<string>();
  return combined.filter((row) => {
    if (!orderIdSet.has(row.orderId) || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}
