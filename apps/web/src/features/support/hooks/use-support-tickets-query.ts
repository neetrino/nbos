'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { projectsApi, type Project } from '@/lib/api/projects';
import { supportApi, type SupportStats, type SupportTicket } from '@/lib/api/support';
import {
  readSupportPageViewFromStorage,
  writeSupportPageViewToStorage,
} from '@/features/support/constants/support-page-view-storage';
import type { SupportPageViewMode } from '@/features/support/constants/support-page-view-options';

export function useSupportTicketsQuery() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<SupportPageViewMode>('kanban');
  const [projectsForFilters, setProjectsForFilters] = useState<Project[]>([]);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  useLayoutEffect(() => {
    setView(readSupportPageViewFromStorage());
  }, []);

  const handleViewModeChange = useCallback((next: SupportPageViewMode) => {
    setView(next);
    writeSupportPageViewToStorage(next);
  }, []);

  const fetchTickets = useCallback(
    async (options?: { soft?: boolean }) => {
      if (!options?.soft) {
        setLoading(true);
      }
      try {
        const { items } = await supportApi.getAll({
          pageSize: 100,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          waitingState:
            filters.waitingState && filters.waitingState !== 'all'
              ? filters.waitingState
              : undefined,
        });
        setTickets(items);
        setError(null);
        try {
          setStats(await supportApi.getStats());
        } catch {
          setStats(null);
        }
      } catch {
        setError('Support tickets could not be loaded. Check your connection and try again.');
        setStats(null);
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
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    tickets,
    stats,
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
    projectsForFilters,
    detailRefreshKey,
    fetchTickets,
    refreshSupportViews,
  };
}
