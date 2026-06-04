'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Headphones, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  PageHero,
  ViewModeSwitch,
} from '@/components/shared';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { SupportTicketsKanbanView } from '@/features/support/components/SupportTicketsKanbanView';
import { SupportTicketsListView } from '@/features/support/components/SupportTicketsListView';
import { SupportWorkflowScopeBanner } from '@/features/support/components/SupportWorkflowScopeBanner';
import { SUPPORT_PAGE_VIEW_OPTIONS } from '@/features/support/constants/support-page-view-options';
import { SUPPORT_TICKET_FILTER_CONFIGS } from '@/features/support/constants/support-ticket-filter-configs';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { buildPortfolioNewTicketHref } from '@/features/clients/constants/client-portfolio-deep-links';
import type { UseProductSupportTabResult } from '@/features/projects/hooks/use-product-support-tab';
import { cn } from '@/lib/utils';

interface ProductSupportTabProps extends UseProductSupportTabResult {
  projectId: string;
}

export function ProductSupportTab({
  projectId,
  displayTickets,
  kanbanColumns,
  boardScope,
  loading,
  error,
  search,
  setSearch,
  filters,
  handleFilterChange,
  clearFilters,
  view,
  setView,
  refetch,
  actions,
}: ProductSupportTabProps) {
  const router = useRouter();

  const openSupportModule = '/support';

  const handleOpenDetail = (ticketId: string) => {
    router.push(`/support?${SUPPORT_TICKET_OPEN_QUERY}=${encodeURIComponent(ticketId)}`);
  };

  if (loading && displayTickets.length === 0) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageHero
        syncModuleTitle={false}
        className="mt-0"
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tickets, code, title…"
            filters={SUPPORT_TICKET_FILTER_CONFIGS}
            filterValues={{
              boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
              ...filters,
            }}
            onFilterChange={handleFilterChange}
            onClearAll={clearFilters}
          />
        }
        viewMode={
          <ViewModeSwitch value={view} onChange={setView} options={SUPPORT_PAGE_VIEW_OPTIONS} />
        }
        trailing={
          <>
            <Link
              href={openSupportModule}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              Open Support
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push(buildPortfolioNewTicketHref(projectId))}
            >
              <Plus size={16} aria-hidden />
              New Ticket
            </Button>
          </>
        }
      />

      <SupportWorkflowScopeBanner scope={boardScope} />

      {displayTickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No support tickets"
          description="Support tickets linked to this product will appear here."
        />
      ) : view === 'list' ? (
        <SupportTicketsListView
          tickets={displayTickets}
          actionId={actions.actionId}
          onOpenDetail={handleOpenDetail}
          onStatusSelect={actions.handleStatusSelect}
          onReopen={(ticket) => void actions.handleReopenTicket(ticket)}
        />
      ) : (
        <SupportTicketsKanbanView
          columns={kanbanColumns}
          boardScope={boardScope}
          actionId={actions.actionId}
          onMove={actions.handleKanbanMove}
          onOpenDetail={handleOpenDetail}
          onReopen={(ticket) => void actions.handleReopenTicket(ticket)}
        />
      )}
    </div>
  );
}
