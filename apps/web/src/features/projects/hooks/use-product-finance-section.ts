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

type SectionUiState = {
  search: string;
  filters: Record<string, string>;
};

const EMPTY_SECTION_STATE: SectionUiState = { search: '', filters: {} };

function createInitialSectionState(): Record<ProductFinanceSection, SectionUiState> {
  return {
    orders: { ...EMPTY_SECTION_STATE },
    subscriptions: { ...EMPTY_SECTION_STATE },
    expenses: {
      search: '',
      filters: { [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active' },
    },
    'client-services': { ...EMPTY_SECTION_STATE },
  };
}

export function useProductFinanceSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = parseProductFinanceSection(searchParams.get(PRODUCT_FINANCE_SECTION_QUERY));
  const [sectionState, setSectionState] =
    useState<Record<ProductFinanceSection, SectionUiState>>(createInitialSectionState);

  const { search, filters } = sectionState[activeSection];
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
      setSectionState((prev) => ({
        ...prev,
        [activeSection]: { ...prev[activeSection], search: value },
      }));
    },
    [activeSection],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setSectionState((prev) => {
        const current = prev[activeSection];
        const nextFilters =
          key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE
            ? (() => {
                const next = { ...current.filters };
                delete next.boardScope;
                return next;
              })()
            : key === EXPENSE_BOARD_SCOPE_FILTER_KEY && value === 'active'
              ? (() => {
                  const next = { ...current.filters };
                  delete next[EXPENSE_BOARD_SCOPE_FILTER_KEY];
                  return next;
                })()
              : { ...current.filters, [key]: value };
        return {
          ...prev,
          [activeSection]: { ...current, filters: nextFilters },
        };
      });
    },
    [activeSection],
  );

  const clearFilters = useCallback(() => {
    setSectionState((prev) => ({
      ...prev,
      [activeSection]:
        activeSection === 'expenses'
          ? { search: '', filters: { [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active' } }
          : { ...EMPTY_SECTION_STATE },
    }));
  }, [activeSection]);

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
