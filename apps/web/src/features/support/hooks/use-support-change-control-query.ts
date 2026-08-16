'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { projectsApi, type Project } from '@/lib/api/projects';
import { useSupportChangeControlPageViewMode } from '@/features/support/constants/support-change-control-page-view-storage';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  getBoardStageKeys,
  resolveBoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useStageColumnBoard } from '@/features/shared/kanban/use-stage-column-board';
import { supportApi, type SupportTicket } from '@/lib/api/support';

export function useSupportChangeControlQuery() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, handleViewModeChange] = useSupportChangeControlPageViewMode();
  const [projectsForFilters, setProjectsForFilters] = useState<Project[]>([]);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [errorOverride, setErrorOverride] = useState<string | null>(null);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, boardScope);
  }, [boardScope, filters.status]);

  const fetchPage = useCallback(
    (params: { page: number; pageSize: number; status: string }) =>
      supportApi.getAll({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        category: 'CHANGE_REQUEST',
        search: debouncedSearch || undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        waitingState:
          filters.waitingState && filters.waitingState !== 'all' ? filters.waitingState : undefined,
      }),
    [debouncedSearch, filters.priority, filters.waitingState],
  );

  const board = useStageColumnBoard<SupportTicket>({
    stageKeys,
    getStageKey: (ticket) => ticket.status,
    fetchPage,
    loadErrorMessage: 'Change control tickets could not be loaded.',
  });

  const {
    items: tickets,
    columnMeta,
    hasMoreAny,
    loading,
    error: boardError,
    reload,
    loadMoreColumn,
    loadMoreAll,
  } = board;

  const fetchTickets = useCallback(async () => {
    await reload();
    setErrorOverride(null);
  }, [reload]);

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets();
    setDetailRefreshKey((key) => key + 1);
  }, [fetchTickets]);

  useEffect(() => {
    let cancelled = false;
    void projectsApi.getAll({ pageSize: 200 }).then((res) => {
      if (!cancelled) {
        setProjectsForFilters(res.items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
        const next = { ...prev };
        delete next.boardScope;
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setError = useCallback((message: string | null) => {
    setErrorOverride(message);
  }, []);

  return {
    tickets,
    columnMeta,
    hasMoreAny,
    loadMoreColumn,
    loadMoreAll,
    boardScope,
    loading,
    error: errorOverride ?? boardError,
    setError,
    search,
    setSearch,
    filters,
    handleFilterChange,
    clearFilters,
    view,
    handleViewModeChange,
    detailRefreshKey,
    projectsForFilters,
    fetchTickets,
    refreshSupportViews,
  };
}
