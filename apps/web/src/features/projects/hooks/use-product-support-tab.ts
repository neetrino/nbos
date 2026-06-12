'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { useSupportPageViewMode } from '@/features/support/constants/support-page-view-storage';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  getBoardStageKeys,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import { supportApi, type SupportTicket } from '@/lib/api/support';

export interface UseProductSupportTabResult {
  tickets: SupportTicket[];
  displayTickets: SupportTicket[];
  kanbanColumns: Array<{
    key: string;
    label: string;
    color: string;
    items: SupportTicket[];
  }>;
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
}

export function useProductSupportTab(
  productId: string,
  enabled: boolean,
): UseProductSupportTabResult {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useSupportPageViewMode();

  const fetchTickets = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { items } = await supportApi.getAll({
        productId,
        pageSize: 100,
        search: search || undefined,
        category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        waitingState:
          filters.waitingState && filters.waitingState !== 'all' ? filters.waitingState : undefined,
      });
      setTickets(items);
      setError(null);
    } catch {
      setError('Support tickets could not be loaded.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [productId, search, filters]);

  const refreshSupportViews = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (enabled) {
      void fetchTickets();
    }
  }, [enabled, fetchTickets]);

  const actions = useSupportTicketActions({
    tickets,
    refreshSupportViews,
    setError,
  });

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

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const hasStatusFilter = Boolean(filters.status) && filters.status !== 'all';

  const displayTickets = useMemo(() => {
    if (hasStatusFilter) return tickets;
    return tickets.filter((ticket) =>
      matchesBoardLifecycleScope(ticket.status, SUPPORT_TICKET_BOARD_STAGES, boardScope),
    );
  }, [tickets, boardScope, hasStatusFilter]);

  const kanbanColumns = useMemo(() => {
    const visibleKeys = getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, boardScope);
    return TICKET_STATUSES.filter((status) => visibleKeys.includes(status.value)).map((status) => ({
      key: status.value,
      label: status.label,
      color: status.color,
      items: displayTickets.filter((ticket) => ticket.status === status.value),
    }));
  }, [displayTickets, boardScope]);

  return {
    tickets,
    displayTickets,
    kanbanColumns,
    boardScope: boardScope as BoardLifecycleScope,
    loading,
    error,
    search,
    setSearch,
    filters,
    handleFilterChange,
    clearFilters,
    view,
    setView,
    refetch: fetchTickets,
    actions,
  };
}
