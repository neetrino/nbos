'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { useSupportChangeControlQuery } from '@/features/support/hooks/use-support-change-control-query';
import { useSupportCreateTicketForm } from '@/features/support/hooks/use-support-create-ticket-form';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { usePermission } from '@/lib/permissions';
import type { SupportKanbanColumn } from '@/features/support/components/SupportTicketsKanbanView';

export function useSupportChangeControlPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openTicketIdFromUrl = searchParams.get(SUPPORT_TICKET_OPEN_QUERY)?.trim() || null;

  const query = useSupportChangeControlQuery();
  const createForm = useSupportCreateTicketForm({
    projectsForFilters: query.projectsForFilters,
    loading: query.loading,
    portfolioProjectIdFromUrl: null,
    portfolioCreateTicketFromUrl: false,
    refreshSupportViews: query.refreshSupportViews,
    setError: query.setError,
    defaultCategory: 'CHANGE_REQUEST',
  });
  const actions = useSupportTicketActions({
    tickets: query.tickets,
    refreshSupportViews: query.refreshSupportViews,
    setError: query.setError,
  });
  const { me } = usePermission();

  const stripSupportTicketOpenFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(SUPPORT_TICKET_OPEN_QUERY)) {
      return;
    }
    params.delete(SUPPORT_TICKET_OPEN_QUERY);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const openSupportDetail = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SUPPORT_TICKET_OPEN_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSupportDetailOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        stripSupportTicketOpenFromUrl();
      }
    },
    [stripSupportTicketOpenFromUrl],
  );

  const kanbanColumns = useMemo((): SupportKanbanColumn[] => {
    const visibleKeys = getBoardStageKeys(SUPPORT_TICKET_BOARD_STAGES, query.boardScope);
    return TICKET_STATUSES.filter((status) => visibleKeys.includes(status.value)).map((status) => {
      const meta = query.columnMeta[status.value];
      return {
        key: status.value,
        label: status.label,
        color: status.color,
        items: query.tickets.filter((ticket) => ticket.status === status.value),
        totalCount: meta?.totalCount,
        hasMore: meta?.hasMore,
        loadingMore: meta?.loadingMore,
      };
    });
  }, [query.boardScope, query.columnMeta, query.tickets]);

  return {
    boardScope: query.boardScope as BoardLifecycleScope,
    displayTickets: query.tickets,
    openTicketIdFromUrl,
    meId: me?.id ?? null,
    openSupportDetail,
    handleSupportDetailOpenChange,
    kanbanColumns,
    hasMoreAny: query.hasMoreAny,
    loadMoreColumn: query.loadMoreColumn,
    loadMoreAll: query.loadMoreAll,
    query,
    createForm,
    actions,
  };
}
