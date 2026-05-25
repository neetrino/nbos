'use client';

import { FilterBar, type FilterConfig } from '@/components/shared';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/features/tasks/constants/tasks';

export const WORKSPACE_TASK_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'status',
    label: 'Stage',
    options: TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  },
  {
    key: 'priority',
    label: 'Urgency',
    options: TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
  },
];

export function WorkspaceRuntimeFilterBar({
  search,
  onSearchChange,
  filterValues,
  onFilterChange,
  onClearFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <FilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by task, project, product, workspace…"
      filters={WORKSPACE_TASK_FILTER_CONFIGS}
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
    />
  );
}
