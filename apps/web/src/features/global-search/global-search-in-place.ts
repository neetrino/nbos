import type { SearchEntityType } from '@/lib/api/search';

/** Entity types that open an in-place sheet via {@link GlobalSearchEntitySheetsHost}. */
export const GLOBAL_SEARCH_IN_PLACE_SHEET_TYPES = new Set<SearchEntityType>([
  'lead',
  'deal',
  'product',
  'invoice',
  'order',
  'subscription',
  'expense',
  'credential',
]);

export function opensGlobalSearchInPlaceSheet(entityType: SearchEntityType): boolean {
  return GLOBAL_SEARCH_IN_PLACE_SHEET_TYPES.has(entityType);
}
