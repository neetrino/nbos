'use client';

import { useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { ACTIVE_FUNCTION_STATUS, FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import { isCatalogRailId, type CatalogRailId } from './function-catalog-grouping';
import { toggleCatalogSelection } from './function-catalog-select';
import { useFunctionCatalogQuery } from './use-function-catalog-query';

export function useFunctionCatalogPicker() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [selectedCategory, setSelectedCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const catalog = useFunctionCatalogQuery({
    search: debouncedSearch,
    status: ACTIVE_FUNCTION_STATUS,
  });
  return {
    search,
    setSearch,
    selectedCategory,
    selectCategory: (id: CatalogRailId | string) => {
      if (isCatalogRailId(id)) setSelectedCategory(id);
    },
    selectedIds,
    selectedSet: new Set(selectedIds),
    toggle: (id: string) => setSelectedIds((current) => toggleCatalogSelection(current, id)),
    reason,
    setReason,
    saving,
    setSaving,
    catalog,
  };
}
