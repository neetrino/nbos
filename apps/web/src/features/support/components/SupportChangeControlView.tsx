'use client';

import { useCallback, useMemo } from 'react';
import { GitPullRequest } from 'lucide-react';
import { SupportChangeControlHero } from '@/features/support/components/SupportChangeControlHero';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { SupportTicketActionOverlays } from '@/features/support/components/SupportTicketActionOverlays';
import { SupportTicketsPageBody } from '@/features/support/components/SupportTicketsPageBody';
import { SupportWorkflowScopeBanner } from '@/features/support/components/SupportWorkflowScopeBanner';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { useSupportChangeControlPage } from '@/features/support/hooks/use-support-change-control-page';

export function SupportChangeControlView() {
  const page = useSupportChangeControlPage();
  const { query, createForm, actions } = page;

  const filterValues = useMemo(
    () => ({
      boardScope: query.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...query.filters,
    }),
    [query.filters],
  );

  const handleNewChangeRequest = useCallback(() => {
    createForm.setCreateOpen(true);
  }, [createForm.setCreateOpen]);

  return (
    <div className="flex h-full flex-col gap-5">
      <SupportChangeControlHero
        search={query.search}
        onSearchChange={query.setSearch}
        filterValues={filterValues}
        onFilterChange={query.handleFilterChange}
        onClearFilters={query.clearFilters}
        view={query.view}
        onViewChange={query.handleViewModeChange}
        onNewChangeRequest={handleNewChangeRequest}
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
        emptyIcon={GitPullRequest}
        emptyTitle="No change requests"
        emptyDescription="Create a change request or classify an existing ticket as Change Request."
        emptyActionLabel="New Change Request"
        onRetry={() => void query.fetchTickets()}
        onCreateFirst={handleNewChangeRequest}
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
