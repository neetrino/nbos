import {
  DELIVERY_FUNCTION_CATEGORIES,
  isDeliveryFunctionCategory,
  type DeliveryFunctionCategory,
} from '@nbos/shared';
import { FUNCTION_CATALOG_ALL_ID, FUNCTION_CATALOG_OTHER_ID } from './function-catalog.constants';

export type CatalogRailCategoryId = DeliveryFunctionCategory | typeof FUNCTION_CATALOG_OTHER_ID;

export type CatalogRailId = typeof FUNCTION_CATALOG_ALL_ID | CatalogRailCategoryId;

export type CatalogCategoryBlock<T extends { category: string }> = {
  id: CatalogRailCategoryId;
  items: T[];
};

export type CatalogRailEntry = {
  id: CatalogRailId;
  count: number;
};

export type CatalogSearchable = {
  title: string;
  summary: string;
  code: string;
  category: string;
};

export function matchesCatalogSearch(item: CatalogSearchable, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [item.title, item.summary, item.code, item.category].some((field) =>
    field.toLowerCase().includes(needle),
  );
}

export function filterCatalogItems<T extends CatalogSearchable>(
  items: readonly T[],
  query: string,
): T[] {
  return items.filter((item) => matchesCatalogSearch(item, query));
}

export function countFunctionsByCategory(
  items: readonly { category: string }[],
): Map<CatalogRailCategoryId, number> {
  const counts = new Map<CatalogRailCategoryId, number>();
  for (const item of items) {
    const id = railCategoryId(item.category);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function buildCatalogRailEntries(
  items: readonly { category: string }[],
): CatalogRailEntry[] {
  return buildCatalogRailFromCounts(items.length, countsRecord(countFunctionsByCategory(items)));
}

export function buildCatalogRailFromCounts(
  total: number,
  counts: Readonly<Record<string, number>>,
): CatalogRailEntry[] {
  const entries: CatalogRailEntry[] = [
    { id: FUNCTION_CATALOG_ALL_ID, count: total },
    ...DELIVERY_FUNCTION_CATEGORIES.map((id) => ({ id, count: counts[id] ?? 0 })),
  ];
  const otherCount = otherCategoryCount(counts);
  if (otherCount > 0) {
    entries.push({ id: FUNCTION_CATALOG_OTHER_ID, count: otherCount });
  }
  return entries;
}

export function groupFunctionsIntoCategoryBlocks<T extends { category: string }>(
  items: readonly T[],
  selected: CatalogRailId,
): CatalogCategoryBlock<T>[] {
  const grouped = new Map<CatalogRailCategoryId, T[]>();
  for (const item of items) {
    const id = railCategoryId(item.category);
    const bucket = grouped.get(id);
    if (bucket) bucket.push(item);
    else grouped.set(id, [item]);
  }
  return visibleBlockIds(selected, grouped).map((id) => ({
    id,
    items: grouped.get(id) ?? [],
  }));
}

export function isCatalogRailId(value: string): value is CatalogRailId {
  return (
    value === FUNCTION_CATALOG_ALL_ID ||
    value === FUNCTION_CATALOG_OTHER_ID ||
    isDeliveryFunctionCategory(value)
  );
}

function railCategoryId(category: string): CatalogRailCategoryId {
  return isDeliveryFunctionCategory(category) ? category : FUNCTION_CATALOG_OTHER_ID;
}

function countsRecord(counts: Map<CatalogRailCategoryId, number>): Record<string, number> {
  return Object.fromEntries(counts);
}

function otherCategoryCount(counts: Readonly<Record<string, number>>): number {
  return Object.entries(counts).reduce((sum, [category, count]) => {
    if (category === FUNCTION_CATALOG_OTHER_ID || !isDeliveryFunctionCategory(category)) {
      return sum + count;
    }
    return sum;
  }, 0);
}

function visibleBlockIds(
  selected: CatalogRailId,
  grouped: Map<CatalogRailCategoryId, unknown[]>,
): CatalogRailCategoryId[] {
  if (selected !== FUNCTION_CATALOG_ALL_ID) {
    return [selected];
  }
  const ids: CatalogRailCategoryId[] = [];
  for (const id of DELIVERY_FUNCTION_CATEGORIES) {
    if ((grouped.get(id)?.length ?? 0) > 0) ids.push(id);
  }
  if ((grouped.get(FUNCTION_CATALOG_OTHER_ID)?.length ?? 0) > 0) {
    ids.push(FUNCTION_CATALOG_OTHER_ID);
  }
  return ids;
}
