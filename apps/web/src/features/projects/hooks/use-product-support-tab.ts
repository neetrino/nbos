'use client';

import { useCallback, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { useSupportPageViewMode } from '@/features/support/constants/support-page-view-storage';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  getBoardStageKeys,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useStageColumnBoard } from '@/features/shared/kanban/use-stage-column-board';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import type { SupportKanbanColumn } from '@/features/support/components/SupportTicketsKanbanView';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

export interface UseProductSupportTabResult {
  tickets: SupportTicket[];
  displayTickets: SupportTicket[];
  kanbanColumns: SupportKanbanColumn[];
  boardScope: BoardLifecycleScope;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filters: Record<string, string>;
  handleFilterChange: (key: string, value: string) => void;
  clearFilters: () => void;
  view: ReturnType<typeof useSupportPageViewMode>[0];
  setView: ReturnType<typeof useSupportPageViewMode>[1];
  refetch: () => Promise<void>;
  actions: ReturnType<typeof useSupportTicketActions>;
  hasMoreAny: boolean;
  loadMoreColumn: (columnKey: string) => void;
  loadMoreAll: () => void;
}

export function useProductSupportTab(
  productId: string,
  enabled: boolean,
): UseProductSupportTabResult {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [filters, setFilters] = usePersistedSearchFilters(SEARCH_FILTER_PAGE_ID.productSupport);
  const [view, setView] = useSupportPageViewMode();
  const [errorOverride, setErrorOverride] = useState<string | null>(null);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, boardScope);
  }, [boardScope, filters.status]);

  const fetchPage = useCallback(
    (params: { page: number; pageSize: number; status: string }) =>
      supportApi.getAll({
        productId,
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: debouncedSearch || undefined,
        category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        waitingState:
          filters.waitingState && filters.waitingState !== 'all' ? filters.waitingState : undefined,
      }),
    [productId, debouncedSearch, filters.category, filters.priority, filters.waitingState],
  );

  const board = useStageColumnBoard<SupportTicket>({
    stageKeys,
    enabled: Boolean(productId) && enabled,
    getStageKey: (ticket) => ticket.status,
    fetchPage,
    loadErrorMessage: 'Support tickets could not be loaded.',
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
    if (!productId) return;
    await reload();
    setErrorOverride(null);
  }, [productId, reload]);

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  const actions = useSupportTicketActions({
    tickets,
    refreshSupportViews,
    setError: setErrorOverride,
  });

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

  const kanbanColumns = useMemo((): SupportKanbanColumn[] => {
    const visibleKeys = getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, boardScope);
    return TICKET_STATUSES.filter((status) => visibleKeys.includes(status.value)).map((status) => {
      const meta = columnMeta[status.value];
      return {
        key: status.value,
        label: status.label,
        color: status.color,
        items: tickets.filter((ticket) => ticket.status === status.value),
        totalCount: meta?.totalCount,
        hasMore: meta?.hasMore,
        loadingMore: meta?.loadingMore,
      };
    });
  }, [boardScope, columnMeta, tickets]);

  return {
    tickets,
    displayTickets: tickets,
    kanbanColumns,
    boardScope: boardScope as BoardLifecycleScope,
    loading,
    error: errorOverride ?? boardError,
    search,
    setSearch,
    filters,
    handleFilterChange,
    clearFilters,
    view,
    setView,
    refetch: fetchTickets,
    actions,
    hasMoreAny,
    loadMoreColumn,
    loadMoreAll,
  };
}
