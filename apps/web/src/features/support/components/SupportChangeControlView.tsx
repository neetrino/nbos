'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { GitPullRequest } from 'lucide-react';
import { SupportChangeControlHero } from '@/features/support/components/SupportChangeControlHero';
import { SupportCreateTicketDialog } from '@/features/support/components/SupportCreateTicketDialog';
import { SupportTicketActionOverlays } from '@/features/support/components/SupportTicketActionOverlays';
import { SupportTicketsPageBody } from '@/features/support/components/SupportTicketsPageBody';
import { SupportWorkflowScopeBanner } from '@/features/support/components/SupportWorkflowScopeBanner';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { useSupportChangeControlPage } from '@/features/support/hooks/use-support-change-control-page';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';

export function SupportChangeControlView() {
  const t = useTranslations('support');
  const page = useSupportChangeControlPage();
  const { query, createForm, actions } = page;
  const displayView = useMobilePreferredView(query.view, 'kanban');

  const filterValues = useMemo(
    () => ({
      boardScope: query.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...query.filters,
    }),
    [query.filters],
  );

  const handleNewChangeRequest = useCallback(() => {
    createForm.setCreateOpen(true);
  }, [createForm]);

  const initialTicket = useMemo(
    () => page.displayTickets.find((ticket) => ticket.id === page.openTicketIdFromUrl) ?? null,
    [page.displayTickets, page.openTicketIdFromUrl],
  );

  return (
    <div className="flex h-full flex-col gap-5 max-md:gap-3">
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
        view={displayView}
        kanbanColumns={page.kanbanColumns}
        actionId={actions.actionId}
        emptyIcon={GitPullRequest}
        emptyTitle={t('changeControl.emptyTitle')}
        emptyDescription={t('changeControl.emptyDescription')}
        emptyActionLabel={t('changeControl.newRequest')}
        onRetry={() => void query.fetchTickets()}
        onCreateFirst={handleNewChangeRequest}
        onKanbanMove={actions.handleKanbanMove}
        onOpenDetail={page.openSupportDetail}
        onReopen={(ticket) => void actions.handleReopenTicket(ticket)}
        onStatusSelect={actions.handleStatusSelect}
        onColumnLoadMore={page.loadMoreColumn}
        hasMoreAny={page.hasMoreAny}
        onLoadMoreAll={page.loadMoreAll}
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
        dialogTitle={t('changeControl.createTitle')}
        submitLabel={t('changeControl.createSubmit')}
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
