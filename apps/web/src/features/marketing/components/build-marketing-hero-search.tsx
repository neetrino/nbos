'use client';

import type { ReactNode } from 'react';
import { IntegratedSearchFilters } from '@/components/shared';

type BuildMarketingHeroSearchParams = {
  search: string;
  onSearchChange: (search: string) => void;
  searchPlaceholder: string;
};

export function buildMarketingHeroSearch({
  search,
  onSearchChange,
  searchPlaceholder,
}: BuildMarketingHeroSearchParams): ReactNode {
  return (
    <IntegratedSearchFilters
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
    />
  );
}
