'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegratedSearchFilters, useModuleHeroSlots, ViewModeSwitch } from '@/components/shared';
import { SUPPORT_CHANGE_CONTROL_FILTER_CONFIGS } from '@/features/support/constants/support-change-control-filter-configs';
import {
  SUPPORT_PAGE_VIEW_OPTIONS,
  type SupportPageViewMode,
} from '@/features/support/constants/support-page-view-options';

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
  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search change requests, project, product…"
          filters={SUPPORT_CHANGE_CONTROL_FILTER_CONFIGS}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch value={view} onChange={onViewChange} options={SUPPORT_PAGE_VIEW_OPTIONS} />
      ),
      trailing: (
        <Button type="button" onClick={onNewChangeRequest}>
          <Plus size={16} aria-hidden />
          New Change Request
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
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <p className="text-muted-foreground text-sm">
      Change requests from maintenance clients: coverage, Extension Deals, and delivery tracking.
    </p>
  );
}
