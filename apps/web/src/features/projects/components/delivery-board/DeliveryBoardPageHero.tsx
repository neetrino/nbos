'use client';

import { useMemo } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  IntegratedSearchFilters,
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
  type ViewModeOption,
} from '@/components/shared';
import { DeliveryBoardKindSegmented } from './DeliveryBoardKindSegmented';
import type { DeliveryBoardKindFilter } from './project-delivery-board-model';
import type { DeliveryBoardClosedFiltersInput } from './delivery-board-closed-filters';
import type { ClosedFilterOptions } from './delivery-board-closed-filters';
import {
  closedFiltersToHeroValues,
  patchClosedFiltersFromHero,
  useDeliveryBoardClosedHeroFilterConfigs,
} from './use-delivery-board-closed-hero-filters';

const PIPELINE_TABS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'closed' as const, label: 'Closed' },
];

const CLOSED_VIEW_OPTIONS: ViewModeOption<'LIST' | 'BOARD'>[] = [
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

export interface DeliveryBoardPageHeroProps {
  pipelineTab: 'active' | 'closed';
  onPipelineTabChange: (tab: 'active' | 'closed') => void;
  kindFilter: DeliveryBoardKindFilter;
  onKindFilterChange: (kind: DeliveryBoardKindFilter) => void;
  closedFilters: DeliveryBoardClosedFiltersInput;
  onClosedFiltersChange: (next: DeliveryBoardClosedFiltersInput) => void;
  closedFilterOptions: ClosedFilterOptions;
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
  closedFilters,
  onClosedFiltersChange,
  closedFilterOptions,
  closedViewMode,
  onClosedViewModeChange,
  projectFilterId,
  onClearProjectFilter,
}: DeliveryBoardPageHeroProps) {
  const closedHeroFilterConfigs = useDeliveryBoardClosedHeroFilterConfigs(closedFilterOptions);

  const closedSearch = useMemo(
    () => (
      <IntegratedSearchFilters
        search={closedFilters.search}
        onSearchChange={(value) => onClosedFiltersChange({ ...closedFilters, search: value })}
        searchPlaceholder="Search closed items…"
        filters={closedHeroFilterConfigs}
        filterValues={closedFiltersToHeroValues(closedFilters)}
        onFilterChange={(key, value) =>
          onClosedFiltersChange(patchClosedFiltersFromHero(closedFilters, key, value))
        }
        onClearAll={() =>
          onClosedFiltersChange({
            search: '',
            projectId: '',
            companyId: '',
            ownerId: '',
            productLineKey: '',
            closedFrom: '',
            closedTo: '',
            deadlineResult: 'ALL',
            result: 'ALL',
          })
        }
      />
    ),
    [closedFilters, closedHeroFilterConfigs, onClosedFiltersChange],
  );

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
      secondaryTabs={
        <DeliveryBoardKindSegmented value={kindFilter} onValueChange={onKindFilterChange} />
      }
      search={pipelineTab === 'closed' ? closedSearch : undefined}
      viewMode={
        pipelineTab === 'closed' ? (
          <ViewModeSwitch
            value={closedViewMode}
            onChange={onClosedViewModeChange}
            options={CLOSED_VIEW_OPTIONS}
          />
        ) : undefined
      }
      trailing={
        projectFilterId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onClearProjectFilter}
          >
            Clear project filter
          </Button>
        ) : null
      }
    />
  );
}
