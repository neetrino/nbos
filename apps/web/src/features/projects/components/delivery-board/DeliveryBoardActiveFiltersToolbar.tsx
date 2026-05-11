'use client';

import type { FilterConfig } from '@/components/shared/FilterBar';
import { FilterBar } from '@/components/shared/FilterBar';
import type {
  ActiveFilterOptions,
  DeliveryBoardActiveFiltersInput,
} from './delivery-board-active-filters';

const WORK_STATUS_OPTIONS: FilterConfig['options'] = [
  { value: 'ACTIVE', label: 'In progress' },
  { value: 'ON_HOLD', label: 'On hold' },
];

function toFilterBarValues(value: DeliveryBoardActiveFiltersInput): Record<string, string> {
  return {
    owner: value.ownerId || 'all',
    workStatus: value.workStatus === 'ALL' ? 'all' : value.workStatus,
  };
}

function patchFromFilterBarKey(
  prev: DeliveryBoardActiveFiltersInput,
  key: string,
  raw: string,
): DeliveryBoardActiveFiltersInput {
  switch (key) {
    case 'owner':
      return { ...prev, ownerId: raw === 'all' ? '' : raw };
    case 'workStatus':
      return {
        ...prev,
        workStatus: raw === 'all' ? 'ALL' : (raw as DeliveryBoardActiveFiltersInput['workStatus']),
      };
    default:
      return prev;
  }
}

export function DeliveryBoardActiveFiltersToolbar({
  value,
  onChange,
  options,
  filteredCount,
  totalCount,
  onClear,
}: {
  value: DeliveryBoardActiveFiltersInput;
  onChange: (next: DeliveryBoardActiveFiltersInput) => void;
  options: ActiveFilterOptions;
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
}) {
  const filters: FilterConfig[] = [
    {
      key: 'owner',
      label: 'owners',
      options: options.owners.map((o) => ({ value: o.id, label: o.label })),
    },
    {
      key: 'workStatus',
      label: 'status',
      options: WORK_STATUS_OPTIONS,
    },
  ];

  const filterValues = toFilterBarValues(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium">Search board</p>
        <span className="text-muted-foreground text-xs tabular-nums">
          {filteredCount} of {totalCount} cards
        </span>
      </div>
      <FilterBar
        search={value.search}
        onSearchChange={(search) => onChange({ ...value, search })}
        searchPlaceholder="Search by name, project, or code…"
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(key, v) => onChange(patchFromFilterBarKey(value, key, v))}
        onClearFilters={() => {
          onClear();
        }}
      />
    </div>
  );
}
