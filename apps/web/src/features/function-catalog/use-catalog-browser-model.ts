'use client';

import { useMemo } from 'react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import {
  buildCatalogRailEntries,
  buildCatalogRailFromCounts,
  filterCatalogItems,
  groupFunctionsIntoCategoryBlocks,
  type CatalogRailId,
} from './function-catalog-grouping';

export function useCatalogBrowserModel(
  items: DeliveryFunctionOperationalDto[],
  search: string,
  selectedCategory: CatalogRailId,
  railCounts?: { total: number; counts: Record<string, number> },
) {
  const visible = useMemo(() => filterCatalogItems(items, search), [items, search]);
  const rail = useMemo(
    () =>
      railCounts
        ? buildCatalogRailFromCounts(railTotal(railCounts), railCounts.counts)
        : buildCatalogRailEntries(visible),
    [railCounts, visible],
  );
  const blocks = useMemo(
    () =>
      groupFunctionsIntoCategoryBlocks(
        visible,
        railCounts ? FUNCTION_CATALOG_ALL_ID : selectedCategory,
      ),
    [railCounts, selectedCategory, visible],
  );
  return {
    rail,
    blocks,
    hasCards: blocks.some((block) => block.items.length > 0),
  };
}

function railTotal(source: { total: number; counts: Record<string, number> }): number {
  const fromCounts = Object.values(source.counts).reduce((sum, count) => sum + count, 0);
  return fromCounts > 0 ? fromCounts : source.total;
}
