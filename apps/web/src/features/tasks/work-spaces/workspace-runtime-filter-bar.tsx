'use client';

import { FilterBar, type FilterConfig } from '@/components/shared';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/features/tasks/constants/tasks';

export const WORKSPACE_TASK_FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    options: TASK_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  },
  {
    key: 'priority',
    label: 'Priority',
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
      searchPlaceholder="Search tasks in this space…"
      filters={WORKSPACE_TASK_FILTER_CONFIGS}
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
    />
  );
}
