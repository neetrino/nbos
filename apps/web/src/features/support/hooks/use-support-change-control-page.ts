'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { useSupportChangeControlQuery } from '@/features/support/hooks/use-support-change-control-query';
import { useSupportCreateTicketForm } from '@/features/support/hooks/use-support-create-ticket-form';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import {
  getBoardStageKeys,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { usePermission } from '@/lib/permissions';

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

  const boardScope = resolveBoardLifecycleScope(query.filters.boardScope);
  const hasStatusFilter = Boolean(query.filters.status) && query.filters.status !== 'all';

  const displayTickets = useMemo(() => {
    if (hasStatusFilter) return query.tickets;
    return query.tickets.filter((ticket) =>
      matchesBoardLifecycleScope(ticket.status, SUPPORT_TICKET_BOARD_STAGES, boardScope),
    );
  }, [query.tickets, boardScope, hasStatusFilter]);

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
    boardScope: boardScope as BoardLifecycleScope,
    displayTickets,
    openTicketIdFromUrl,
    meId: me?.id ?? null,
    openSupportDetail,
    handleSupportDetailOpenChange,
    kanbanColumns,
    query,
    createForm,
    actions,
  };
}
