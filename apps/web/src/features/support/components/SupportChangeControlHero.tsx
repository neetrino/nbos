'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegratedSearchFilters, useModuleHeroSlots, ViewModeSwitch } from '@/components/shared';
import { getSupportChangeControlFilterConfigs } from '@/features/support/constants/support-change-control-filter-configs';
import {
  getSupportPageViewOptions,
  type SupportPageViewMode,
} from '@/features/support/constants/support-page-view-options';
import type { SupportTranslator } from '@/features/support/support-message-keys';

export interface SupportChangeControlHeroProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  view: SupportPageViewMode;
  onViewChange: (mode: SupportPageViewMode) => void;
  onNewChangeRequest: () => void;
}

export function SupportChangeControlHero({
  search,
  onSearchChange,
  filterValues,
  onFilterChange,
  onClearFilters,
  view,
  onViewChange,
  onNewChangeRequest,
}: SupportChangeControlHeroProps) {
  const t = useTranslations('support') as SupportTranslator;
  const filters = useMemo(() => getSupportChangeControlFilterConfigs(t), [t]);
  const viewOptions = useMemo(() => getSupportPageViewOptions(t), [t]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={t('changeControl.searchPlaceholder')}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearFilters}
        />
      ),
      viewMode: <ViewModeSwitch value={view} onChange={onViewChange} options={viewOptions} />,
      trailing: (
        <Button type="button" onClick={onNewChangeRequest}>
          <Plus size={16} aria-hidden />
          {t('changeControl.newRequest')}
        </Button>
      ),
    }),
    [
      search,
      onSearchChange,
      filterValues,
      onFilterChange,
      onClearFilters,
      view,
      onViewChange,
      onNewChangeRequest,
      filters,
      viewOptions,
      t,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return null;
}
