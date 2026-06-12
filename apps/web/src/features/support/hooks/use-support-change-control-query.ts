'use client';

import { useCallback, useEffect, useState } from 'react';
import { projectsApi, type Project } from '@/lib/api/projects';
import { useSupportChangeControlPageViewMode } from '@/features/support/constants/support-change-control-page-view-storage';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { supportApi, type SupportTicket } from '@/lib/api/support';

export function useSupportChangeControlQuery() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, handleViewModeChange] = useSupportChangeControlPageViewMode();
  const [projectsForFilters, setProjectsForFilters] = useState<Project[]>([]);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const fetchTickets = useCallback(
    async (options?: { soft?: boolean }) => {
      if (!options?.soft) {
        setLoading(true);
      }
      try {
        const { items } = await supportApi.getAll({
          pageSize: 100,
          category: 'CHANGE_REQUEST',
          search: search || undefined,
          priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          waitingState:
            filters.waitingState && filters.waitingState !== 'all'
              ? filters.waitingState
              : undefined,
        });
        setTickets(items);
        setError(null);
      } catch {
        setError('Change control tickets could not be loaded.');
      } finally {
        if (!options?.soft) {
          setLoading(false);
        }
      }
    },
    [search, filters],
  );

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets({ soft: true });
    setDetailRefreshKey((key) => key + 1);
  }, [fetchTickets]);

  useEffect(() => {
    void fetchTickets();
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

  return {
    tickets,
    loading,
    error,
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
