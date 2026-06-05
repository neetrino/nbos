'use client';

import { useCallback, useMemo } from 'react';
import { Headphones, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { SupportPageHero } from '@/features/support/components/SupportPageHero';
import { SupportWorkflowScopeBanner } from '@/features/support/components/SupportWorkflowScopeBanner';
import { SupportTicketActionOverlays } from '@/features/support/components/SupportTicketActionOverlays';
import { SupportTicketsKanbanView } from '@/features/support/components/SupportTicketsKanbanView';
import { SupportTicketsListView } from '@/features/support/components/SupportTicketsListView';
import type { SupportKanbanColumn } from '@/features/support/components/SupportTicketsKanbanView';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type { SupportPageViewMode } from '@/features/support/constants/support-page-view-options';
import { useSupportPage } from '@/features/support/hooks/use-support-page';
import type { SupportTicket } from '@/lib/api/support';

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

      <SupportPageBody
        loading={query.loading}
        error={query.error}
        tickets={page.displayTickets}
        boardScope={page.boardScope}
        view={query.view}
        kanbanColumns={page.kanbanColumns}
        actionId={actions.actionId}
        onRetry={() => void query.fetchTickets()}
        onCreateFirst={() => createForm.setCreateOpen(true)}
        onKanbanMove={actions.handleKanbanMove}
        onOpenDetail={page.openSupportDetail}
        onReopen={(ticket) => void actions.handleReopenTicket(ticket)}
        onStatusSelect={actions.handleStatusSelect}
      />

      <SupportTicketActionOverlays
        ticketId={page.openTicketIdFromUrl}
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
        coverageDecision={createForm.createCoverageDecision}
        contactId={createForm.createContactId}
        onTitleChange={createForm.setCreateTitle}
        onProjectIdChange={createForm.setCreateProjectId}
        onProductIdChange={createForm.setCreateProductId}
        onCategoryChange={createForm.setCreateCategory}
        onPriorityChange={createForm.setCreatePriority}
        onDescriptionChange={createForm.setCreateDescription}
        onCoverageDecisionChange={createForm.setCreateCoverageDecision}
        onContactIdChange={createForm.setCreateContactId}
        onSubmit={() => void createForm.submitCreateTicket()}
        submitting={createForm.createSubmitting}
      />
    </div>
  );
}

type SupportPageBodyProps = {
  loading: boolean;
  error: string | null;
  tickets: SupportTicket[];
  boardScope: BoardLifecycleScope;
  view: SupportPageViewMode;
  kanbanColumns: SupportKanbanColumn[];
  actionId: string | null;
  onRetry: () => void;
  onCreateFirst: () => void;
  onKanbanMove: (itemId: string, from: string, toColumn: string) => void;
  onOpenDetail: (id: string) => void;
  onReopen: (ticket: SupportTicket) => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
};

function SupportPageBody({
  loading,
  error,
  tickets,
  boardScope,
  view,
  kanbanColumns,
  actionId,
  onRetry,
  onCreateFirst,
  onKanbanMove,
  onOpenDetail,
  onReopen,
  onStatusSelect,
}: SupportPageBodyProps) {
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Headphones}
        title="No tickets yet"
        description="Support tickets will appear here"
        action={
          <Button type="button" onClick={onCreateFirst}>
            <Plus size={16} aria-hidden />
            Create First Ticket
          </Button>
        }
      />
    );
  }
  if (view === 'kanban') {
    return (
      <SupportTicketsKanbanView
        columns={kanbanColumns}
        boardScope={boardScope}
        actionId={actionId}
        onMove={onKanbanMove}
        onOpenDetail={onOpenDetail}
        onReopen={onReopen}
      />
    );
  }
  return (
    <SupportTicketsListView
      tickets={tickets}
      actionId={actionId}
      onOpenDetail={onOpenDetail}
      onStatusSelect={onStatusSelect}
      onReopen={onReopen}
    />
  );
}
