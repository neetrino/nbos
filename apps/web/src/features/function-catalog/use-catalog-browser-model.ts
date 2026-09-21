'use client';

import { useMemo } from 'react';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import {
  buildCatalogRailEntries,
  filterCatalogItems,
  groupFunctionsIntoCategoryBlocks,
  type CatalogRailId,
} from './function-catalog-grouping';

export function useCatalogBrowserModel(
  items: DeliveryFunctionOperationalDto[],
  search: string,
  selectedCategory: CatalogRailId,
) {
  const visible = useMemo(() => filterCatalogItems(items, search), [items, search]);
  const rail = useMemo(() => buildCatalogRailEntries(visible), [visible]);
  const blocks = useMemo(
    () => groupFunctionsIntoCategoryBlocks(visible, selectedCategory),
    [selectedCategory, visible],
  );
  return {
    rail,
    blocks,
    hasCards: blocks.some((block) => block.items.length > 0),
  };
}
