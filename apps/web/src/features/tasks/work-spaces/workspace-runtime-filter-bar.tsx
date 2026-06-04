'use client';

import { useCallback, useState } from 'react';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/features/tasks/constants/tasks';
import type { FilterConfig } from '@/components/shared';

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

export type WorkspaceRuntimeTaskFilters = {
  search: string;
  filterValues: Record<string, string>;
  heroFilterValues: Record<string, string>;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
};

/** Shared task search/filter state for workspace PageHero and runtime board filtering. */
export function useWorkspaceRuntimeTaskFilters(): WorkspaceRuntimeTaskFilters {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const onFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => {
      if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
        const next = { ...prev };
        delete next.boardScope;
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const onClearFilters = useCallback(() => {
    setSearch('');
    setFilterValues({});
  }, []);

  return {
    search,
    filterValues,
    heroFilterValues: {
      boardScope: filterValues.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...filterValues,
    },
    onSearchChange: setSearch,
    onFilterChange,
    onClearFilters,
  };
}
