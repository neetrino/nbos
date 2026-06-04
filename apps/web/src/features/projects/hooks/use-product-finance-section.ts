'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
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

type SectionUiState = {
  search: string;
  filters: Record<string, string>;
};

const EMPTY_SECTION_STATE: SectionUiState = { search: '', filters: {} };

function createInitialSectionState(): Record<ProductFinanceSection, SectionUiState> {
  return {
    orders: { ...EMPTY_SECTION_STATE },
    subscriptions: { ...EMPTY_SECTION_STATE },
    expenses: { ...EMPTY_SECTION_STATE },
    domains: { ...EMPTY_SECTION_STATE },
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
                const { boardScope: _, ...rest } = current.filters;
                return rest;
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
      [activeSection]: { ...EMPTY_SECTION_STATE },
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
    setSearch,
    filters,
    filterConfigs,
    filterValuesForUi,
    searchPlaceholder,
    handleFilterChange,
    clearFilters,
  };
}
