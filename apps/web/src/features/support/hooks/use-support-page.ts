'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import {
  getBoardStageKeys,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { useSupportScopeStatsCsvExport } from '@/features/support/use-support-scope-stats-csv-export';
import { usePermission } from '@/lib/permissions';
import { useSupportCreateTicketForm } from '@/features/support/hooks/use-support-create-ticket-form';
import { useSupportTicketActions } from '@/features/support/hooks/use-support-ticket-actions';
import { useSupportTicketsQuery } from '@/features/support/hooks/use-support-tickets-query';

export function useSupportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openTicketIdFromUrl = searchParams.get(SUPPORT_TICKET_OPEN_QUERY)?.trim() || null;
  const portfolioProjectIdFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.projectId)?.trim() ?? null;
  const portfolioCreateTicketFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.createTicket) === '1';

  const query = useSupportTicketsQuery();
  const createForm = useSupportCreateTicketForm({
    projectsForFilters: query.projectsForFilters,
    loading: query.loading,
    portfolioProjectIdFromUrl,
    portfolioCreateTicketFromUrl,
    refreshSupportViews: query.refreshSupportViews,
    setError: query.setError,
  });
  const actions = useSupportTicketActions({
    tickets: query.tickets,
    refreshSupportViews: query.refreshSupportViews,
    setError: query.setError,
  });

  const { me } = usePermission();
  const { handleExportScopeStatsCsv } = useSupportScopeStatsCsvExport(query.stats);

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
    exportScopeStatsDisabled: query.loading || !query.stats,
    handleExportScopeStatsCsv,
    openSupportDetail,
    handleSupportDetailOpenChange,
    kanbanColumns,
    query,
    createForm,
    actions,
  };
}
