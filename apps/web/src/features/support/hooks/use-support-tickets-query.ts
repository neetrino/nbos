'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { projectsApi, type Project } from '@/lib/api/projects';
import { supportApi, type SupportStats, type SupportTicket } from '@/lib/api/support';
import { useSupportPageViewMode } from '@/features/support/constants/support-page-view-storage';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  getBoardStageKeys,
  resolveBoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useStageColumnBoard } from '@/features/shared/kanban/use-stage-column-board';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

const CHANGE_REQUEST_CATEGORY = 'CHANGE_REQUEST';

export function useSupportTicketsQuery() {
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [filters, setFilters] = usePersistedSearchFilters(SEARCH_FILTER_PAGE_ID.supportTickets);
  const [view, handleViewModeChange] = useSupportPageViewMode();
  const [projectsForFilters, setProjectsForFilters] = useState<Project[]>([]);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [errorOverride, setErrorOverride] = useState<string | null>(null);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, boardScope);
  }, [boardScope, filters.status]);

  const categoryFilter =
    filters.category && filters.category !== 'all' ? filters.category : undefined;

  const fetchPage = useCallback(
    async (params: { page: number; pageSize: number; status: string }) => {
      const data = await supportApi.getAll({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: debouncedSearch || undefined,
        category: categoryFilter,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        waitingState:
          filters.waitingState && filters.waitingState !== 'all' ? filters.waitingState : undefined,
      });
      if (categoryFilter) return data;
      return {
        ...data,
        items: data.items.filter((ticket) => ticket.category !== CHANGE_REQUEST_CATEGORY),
      };
    },
    [categoryFilter, debouncedSearch, filters.priority, filters.waitingState],
  );

  const board = useStageColumnBoard<SupportTicket>({
    stageKeys,
    getStageKey: (ticket) => ticket.status,
    fetchPage,
    loadErrorMessage: 'Support tickets could not be loaded. Check your connection and try again.',
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

  const fetchStats = useCallback(async () => {
    try {
      setStats(await supportApi.getStats());
    } catch {
      setStats(null);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    await reload();
    await fetchStats();
    setErrorOverride(null);
  }, [reload, fetchStats]);

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets();
    setDetailRefreshKey((key) => key + 1);
  }, [fetchTickets]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await supportApi.getStats();
        if (!cancelled) setStats(next);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
          const next = { ...prev };
          delete next.boardScope;
          return next;
        }
        return { ...prev, [key]: value };
      });
    },
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

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
    stats,
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
    projectsForFilters,
    detailRefreshKey,
    fetchTickets,
    refreshSupportViews,
  };
}
