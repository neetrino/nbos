'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import { defaultCredentialVaultSortFilter } from '@/features/credentials/constants/credential-vault-list-sort';
import { categoryBoardColumnsForQuickFilter } from '@/features/credentials/constants/credential-vault-categories';
import { buildCredentialsVaultFilterConfigs } from '@/features/credentials/utils/build-credentials-vault-filter-configs';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  filterProductCredentials,
  productCredentialsDefaultFilters,
  productCredentialsFilterValuesForUi,
  productCredentialsQuickCategoryChips,
} from '@/features/projects/utils/filter-product-credentials';

export function useProductCredentialsFilter(credentials: CredentialListItem[]) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(productCredentialsDefaultFilters);
  const [quickCategory, setQuickCategory] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<Set<CredentialQuickFilterKey>>(new Set());

  const quickCategoryChips = useMemo(() => productCredentialsQuickCategoryChips(), []);
  const filterConfigs = useMemo(() => buildCredentialsVaultFilterConfigs('project', 'active'), []);
  const filterValuesForUi = useMemo(() => productCredentialsFilterValuesForUi(filters), [filters]);

  const displayCredentials = useMemo(
    () =>
      filterProductCredentials(credentials, {
        search,
        filters,
        quickCategory,
        quickFilters,
        quickCategoryChips,
      }),
    [credentials, search, filters, quickCategory, quickFilters, quickCategoryChips],
  );

  const boardCategoryColumns = useMemo(
    () => categoryBoardColumnsForQuickFilter(quickCategoryChips, quickCategory),
    [quickCategoryChips, quickCategory],
  );

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      ...productCredentialsDefaultFilters(),
      sort: defaultCredentialVaultSortFilter('active'),
    });
    setQuickCategory(null);
    setQuickFilters(new Set());
    setSearch('');
  }, []);

  const toggleQuickFilter = useCallback((key: CredentialQuickFilterKey) => {
    setQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return {
    search,
    setSearch,
    filters,
    filterConfigs,
    filterValuesForUi,
    handleFilterChange,
    clearFilters,
    quickCategory,
    setQuickCategory,
    quickFilters,
    toggleQuickFilter,
    quickCategoryChips,
    displayCredentials,
    boardCategoryColumns,
  };
}
