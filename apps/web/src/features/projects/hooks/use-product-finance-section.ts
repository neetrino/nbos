'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/components/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { PRODUCT_FINANCE_SEARCH_DEBOUNCE_MS } from '@/features/projects/constants/product-finance.constants';
import {
  parseProductFinanceSection,
  PRODUCT_FINANCE_SECTION_DEFAULT,
  PRODUCT_FINANCE_SECTION_QUERY,
  type ProductFinanceSection,
} from '@/features/projects/constants/product-finance-section';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import {
  productFinanceFilterConfigs,
  productFinanceSearchPlaceholder,
} from '@/features/projects/constants/product-finance-filter-configs';
import { productFinanceFilterValuesForUi } from '@/features/projects/utils/filter-product-finance-data';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

const EMPTY_SECTION_SEARCH: Record<ProductFinanceSection, string> = {
  orders: '',
  subscriptions: '',
  expenses: '',
  'client-services': '',
};

function defaultFiltersForSection(section: ProductFinanceSection): Record<string, string> {
  if (section === 'expenses') {
    return { [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active' };
  }
  return {};
}

function nextSectionFilters(
  current: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
    const next = { ...current };
    delete next.boardScope;
    return next;
  }
  if (key === EXPENSE_BOARD_SCOPE_FILTER_KEY && value === 'active') {
    const next = { ...current };
    delete next[EXPENSE_BOARD_SCOPE_FILTER_KEY];
    return next;
  }
  return { ...current, [key]: value };
}

export function useProductFinanceSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = parseProductFinanceSection(searchParams.get(PRODUCT_FINANCE_SECTION_QUERY));
  const [sectionSearch, setSectionSearch] = useState(EMPTY_SECTION_SEARCH);
  const [filters, setFilters] = usePersistedSearchFilters(
    `${SEARCH_FILTER_PAGE_ID.productFinance}.${activeSection}`,
    defaultFiltersForSection(activeSection),
  );

  const search = sectionSearch[activeSection];
  const debouncedSearchRaw = useDebouncedValue(search, PRODUCT_FINANCE_SEARCH_DEBOUNCE_MS);
  const debouncedSearch = debouncedSearchRaw.trim();

  const setActiveSection = useCallback(
    (section: ProductFinanceSection) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (section === PRODUCT_FINANCE_SECTION_DEFAULT) {
        nextParams.delete(PRODUCT_FINANCE_SECTION_QUERY);
      } else {
        nextParams.set(PRODUCT_FINANCE_SECTION_QUERY, section);
      }
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSectionSearch((prev) => ({ ...prev, [activeSection]: value }));
    },
    [activeSection, setSectionSearch],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilters((current) => nextSectionFilters(current, key, value));
    },
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilters(defaultFiltersForSection(activeSection));
  }, [activeSection, setFilters, setSearch]);

  const filterConfigs = useMemo(() => productFinanceFilterConfigs(activeSection), [activeSection]);
  const filterValuesForUi = useMemo(
    () => productFinanceFilterValuesForUi(activeSection, filters),
    [activeSection, filters],
  );
  const searchPlaceholder = useMemo(
    () => productFinanceSearchPlaceholder(activeSection),
    [activeSection],
  );

  return {
    activeSection,
    setActiveSection,
    search,
    debouncedSearch,
    setSearch,
    filters,
    filterConfigs,
    filterValuesForUi,
    searchPlaceholder,
    handleFilterChange,
    clearFilters,
  };
}
