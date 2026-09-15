'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/components/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PRODUCT_FINANCE_SEARCH_DEBOUNCE_MS } from '@/features/projects/constants/product-finance.constants';
import {
  parseProductFinanceSection,
  PRODUCT_FINANCE_SECTION_DEFAULT,
  PRODUCT_FINANCE_SECTION_QUERY,
  type ProductFinanceSection,
} from '@/features/projects/constants/product-finance-section';
import {
  productFinanceFilterConfigs,
  productFinanceSearchPlaceholder,
} from '@/features/projects/constants/product-finance-filter-configs';
import { productFinanceFilterValuesForUi } from '@/features/projects/utils/filter-product-finance-data';
import {
  defaultProductFinanceFiltersForSection,
  nextProductFinanceSectionFilters,
} from '@/features/projects/utils/product-finance-section-filters';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

const EMPTY_SECTION_SEARCH: Record<ProductFinanceSection, string> = {
  orders: '',
  invoices: '',
  subscriptions: '',
  expenses: '',
  'client-services': '',
};

export function useProductFinanceSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = parseProductFinanceSection(searchParams.get(PRODUCT_FINANCE_SECTION_QUERY));
  const [sectionSearch, setSectionSearch] = useState(EMPTY_SECTION_SEARCH);
  const [filters, setFilters] = usePersistedSearchFilters(
    `${SEARCH_FILTER_PAGE_ID.productFinance}.${activeSection}`,
    defaultProductFinanceFiltersForSection(activeSection),
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
      setFilters((current) => nextProductFinanceSectionFilters(current, key, value));
    },
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilters(defaultProductFinanceFiltersForSection(activeSection));
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
