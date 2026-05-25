'use client';

import { useCallback } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  IntegratedSearchFilters,
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
  type ViewModeOption,
} from '@/components/shared';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';
import type { DeliveryBoardClosedFiltersInput } from './delivery-board-closed-filters';
import type { ClosedFilterOptions } from './delivery-board-closed-filters';
import type {
  ActiveFilterOptions,
  DeliveryBoardActiveFiltersInput,
} from './delivery-board-active-filters';
import { DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS } from './delivery-board-active-filters';
import {
  activeFiltersToHeroValues,
  patchActiveFiltersFromHero,
  useDeliveryBoardActiveHeroFilterConfigs,
} from './use-delivery-board-active-hero-filters';
import {
  closedFiltersToHeroValues,
  patchClosedFiltersFromHero,
  useDeliveryBoardClosedHeroFilterConfigs,
} from './use-delivery-board-closed-hero-filters';

const PIPELINE_TABS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'closed' as const, label: 'Closed' },
];

const PIPELINE_VIEW_OPTIONS: ViewModeOption<'LIST' | 'BOARD'>[] = [
  {
    value: 'LIST',
    label: 'List',
    icon: <LayoutList className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Table view',
  },
  {
    value: 'BOARD',
    label: 'Board',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Board view',
  },
];

const DEFAULT_CLOSED_FILTERS: DeliveryBoardClosedFiltersInput = {
  search: '',
  projectId: '',
  companyId: '',
  ownerId: '',
  productLineKey: '',
  closedFrom: '',
  closedTo: '',
  deadlineResult: 'ALL',
  result: 'ALL',
};

export interface DeliveryBoardPageHeroProps {
  pipelineTab: 'active' | 'closed';
  onPipelineTabChange: (tab: 'active' | 'closed') => void;
  kindFilter: DeliveryBoardKindFilter;
  onKindFilterChange: (kind: DeliveryBoardKindFilter) => void;
  activeFilters: DeliveryBoardActiveFiltersInput;
  onActiveFiltersChange: (next: DeliveryBoardActiveFiltersInput) => void;
  activeFilterOptions: ActiveFilterOptions;
  activeFilteredCount: number;
  activeTotalCount: number;
  closedFilteredCount: number;
  closedTotalCount: number;
  closedFilters: DeliveryBoardClosedFiltersInput;
  onClosedFiltersChange: (next: DeliveryBoardClosedFiltersInput) => void;
  closedFilterOptions: ClosedFilterOptions;
  activeViewMode: 'LIST' | 'BOARD';
  onActiveViewModeChange: (mode: 'LIST' | 'BOARD') => void;
  closedViewMode: 'LIST' | 'BOARD';
  onClosedViewModeChange: (mode: 'LIST' | 'BOARD') => void;
  projectFilterId: string | null;
  onClearProjectFilter: () => void;
}

export function DeliveryBoardPageHero({
  pipelineTab,
  onPipelineTabChange,
  kindFilter,
  onKindFilterChange,
  activeFilters,
  onActiveFiltersChange,
  activeFilterOptions,
  activeFilteredCount,
  activeTotalCount,
  closedFilteredCount,
  closedTotalCount,
  closedFilters,
  onClosedFiltersChange,
  closedFilterOptions,
  activeViewMode,
  onActiveViewModeChange,
  closedViewMode,
  onClosedViewModeChange,
  projectFilterId,
  onClearProjectFilter,
}: DeliveryBoardPageHeroProps) {
  const activeHeroFilterConfigs = useDeliveryBoardActiveHeroFilterConfigs(activeFilterOptions);
  const closedHeroFilterConfigs = useDeliveryBoardClosedHeroFilterConfigs(closedFilterOptions);

  const handleHeroFilterChange = useCallback(
    (key: string, value: string) => {
      if (pipelineTab === 'active') {
        const next = patchActiveFiltersFromHero(kindFilter, activeFilters, key, value);
        onKindFilterChange(next.kindFilter);
        onActiveFiltersChange(next.filters);
        return;
      }
      const next = patchClosedFiltersFromHero(kindFilter, closedFilters, key, value);
      onKindFilterChange(next.kindFilter);
      onClosedFiltersChange(next.filters);
    },
    [
      activeFilters,
      closedFilters,
      kindFilter,
      onActiveFiltersChange,
      onClosedFiltersChange,
      onKindFilterChange,
      pipelineTab,
    ],
  );

  const handleClearAll = useCallback(() => {
    onKindFilterChange('ALL');
    if (pipelineTab === 'active') {
      onActiveFiltersChange({ ...DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS });
      return;
    }
    onClosedFiltersChange({ ...DEFAULT_CLOSED_FILTERS });
  }, [onActiveFiltersChange, onClosedFiltersChange, onKindFilterChange, pipelineTab]);

  const countLabel =
    pipelineTab === 'active'
      ? `${activeFilteredCount} of ${activeTotalCount} cards`
      : `${closedFilteredCount} of ${closedTotalCount} cards`;

  return (
    <PageHero
      title="Delivery Board"
      tabs={
        <PageHeroTabs
          value={pipelineTab}
          onChange={onPipelineTabChange}
          options={PIPELINE_TABS}
          ariaLabel="Delivery pipeline"
        />
      }
      search={
        pipelineTab === 'active' ? (
          <IntegratedSearchFilters
            search={activeFilters.search}
            onSearchChange={(value) => onActiveFiltersChange({ ...activeFilters, search: value })}
            searchPlaceholder="Search by name, project, or code…"
            filters={activeHeroFilterConfigs}
            filterValues={activeFiltersToHeroValues(kindFilter, activeFilters)}
            onFilterChange={handleHeroFilterChange}
            onClearAll={handleClearAll}
          />
        ) : (
          <IntegratedSearchFilters
            search={closedFilters.search}
            onSearchChange={(value) => onClosedFiltersChange({ ...closedFilters, search: value })}
            searchPlaceholder="Search closed items…"
            filters={closedHeroFilterConfigs}
            filterValues={closedFiltersToHeroValues(kindFilter, closedFilters)}
            onFilterChange={handleHeroFilterChange}
            onClearAll={handleClearAll}
          />
        )
      }
      viewMode={
        <ViewModeSwitch
          value={pipelineTab === 'active' ? activeViewMode : closedViewMode}
          onChange={pipelineTab === 'active' ? onActiveViewModeChange : onClosedViewModeChange}
          options={PIPELINE_VIEW_OPTIONS}
        />
      }
      trailing={
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {countLabel ? (
            <span className="text-muted-foreground text-xs tabular-nums">{countLabel}</span>
          ) : null}
          {projectFilterId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onClearProjectFilter}
            >
              Clear project filter
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
