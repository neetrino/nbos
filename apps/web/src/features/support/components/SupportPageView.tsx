'use client';

import { useCallback, useMemo } from 'react';
import { Headphones } from 'lucide-react';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { SupportPageHero } from '@/features/support/components/SupportPageHero';
import { SupportWorkflowScopeBanner } from '@/features/support/components/SupportWorkflowScopeBanner';
import { SupportTicketActionOverlays } from '@/features/support/components/SupportTicketActionOverlays';
import { SupportTicketsPageBody } from '@/features/support/components/SupportTicketsPageBody';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { useSupportPage } from '@/features/support/hooks/use-support-page';

export function SupportPageView() {
  const page = useSupportPage();
  const { query, createForm, actions } = page;

  const filterValues = useMemo(
    () => ({
      boardScope: query.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...query.filters,
    }),
    [query.filters],
  );

  const handleNewTicket = useCallback(() => {
    createForm.setCreateOpen(true);
  }, [createForm.setCreateOpen]);

  const initialTicket = useMemo(
    () => page.displayTickets.find((ticket) => ticket.id === page.openTicketIdFromUrl) ?? null,
    [page.displayTickets, page.openTicketIdFromUrl],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <SupportPageHero
        search={query.search}
        onSearchChange={query.setSearch}
        filterValues={filterValues}
        onFilterChange={query.handleFilterChange}
        onClearFilters={query.clearFilters}
        view={query.view}
        onViewChange={query.handleViewModeChange}
        exportDisabled={page.exportScopeStatsDisabled}
        onExportScopeStatsCsv={page.handleExportScopeStatsCsv}
        onNewTicket={handleNewTicket}
      />

      <SupportWorkflowScopeBanner scope={page.boardScope} />

      <SupportTicketsPageBody
        loading={query.loading}
        error={query.error}
        tickets={page.displayTickets}
        boardScope={page.boardScope}
        view={query.view}
        kanbanColumns={page.kanbanColumns}
        actionId={actions.actionId}
        emptyIcon={Headphones}
        emptyTitle="No tickets yet"
        emptyDescription="Support tickets will appear here"
        emptyActionLabel="Create First Ticket"
        onRetry={() => void query.fetchTickets()}
        onCreateFirst={handleNewTicket}
        onKanbanMove={actions.handleKanbanMove}
        onOpenDetail={page.openSupportDetail}
        onReopen={(ticket) => void actions.handleReopenTicket(ticket)}
        onStatusSelect={actions.handleStatusSelect}
      />

      <SupportTicketActionOverlays
        ticketId={page.openTicketIdFromUrl}
        initialTicket={initialTicket}
        open={Boolean(page.openTicketIdFromUrl)}
        onOpenChange={page.handleSupportDetailOpenChange}
        detailRefreshKey={query.detailRefreshKey}
        meId={page.meId}
        onListInvalidate={() => void query.refreshSupportViews()}
        actions={actions}
      />

      <SupportCreateTicketDialog
        open={createForm.createOpen}
        onOpenChange={createForm.setCreateOpen}
        title={createForm.createTitle}
        projectId={createForm.createProjectId}
        productId={createForm.createProductId}
        category={createForm.createCategory}
        priority={createForm.createPriority}
        description={createForm.createDescription}
        onTitleChange={createForm.setCreateTitle}
        onProjectIdChange={createForm.setCreateProjectId}
        onProductIdChange={createForm.setCreateProductId}
        onCategoryChange={createForm.setCreateCategory}
        onPriorityChange={createForm.setCreatePriority}
        onDescriptionChange={createForm.setCreateDescription}
        onSubmit={() => void createForm.submitCreateTicket()}
        submitting={createForm.createSubmitting}
      />
    </div>
  );
}
