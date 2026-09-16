'use client';

import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DataView,
  EmptyState,
  ListMutationErrorBanner,
  LoadingState,
  QueryLoadError,
} from '@/components/shared';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { SupportTicketsKanbanView } from '@/features/support/components/SupportTicketsKanbanView';
import { SupportTicketsListView } from '@/features/support/components/SupportTicketsListView';
import type { SupportKanbanColumn } from '@/features/support/components/SupportTicketsKanbanView';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { SupportPageViewMode } from '@/features/support/constants/support-page-view-options';
import type { SupportTicket } from '@/lib/api/support';

export type SupportTicketsPageBodyProps = {
  loading: boolean;
  error: string | null;
  tickets: SupportTicket[];
  boardScope: BoardLifecycleScope;
  view: SupportPageViewMode;
  kanbanColumns: SupportKanbanColumn[];
  actionId: string | null;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onRetry: () => void;
  onDismissError: () => void;
  onCreateFirst?: () => void;
  onKanbanMove: (itemId: string, from: string, toColumn: string) => void;
  onOpenDetail: (id: string) => void;
  onReopen: (ticket: SupportTicket) => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
  onColumnLoadMore?: (columnKey: string) => void;
  hasMoreAny?: boolean;
  onLoadMoreAll?: () => void;
};

export function SupportTicketsPageBody({
  loading,
  error,
  tickets,
  boardScope,
  view,
  kanbanColumns,
  actionId,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onRetry,
  onDismissError,
  onCreateFirst,
  onKanbanMove,
  onOpenDetail,
  onReopen,
  onStatusSelect,
  onColumnLoadMore,
  hasMoreAny = false,
  onLoadMoreAll,
}: SupportTicketsPageBodyProps) {
  return (
    <>
      {error && tickets.length > 0 ? (
        <ListMutationErrorBanner message={error} onDismiss={onDismissError} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={tickets.length > 0}
        loadingFallback={<LoadingState />}
        errorFallback={<QueryLoadError description={error ?? ''} onRetry={onRetry} />}
        emptyFallback={
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              onCreateFirst && emptyActionLabel ? (
                <Button type="button" onClick={onCreateFirst}>
                  <Plus size={16} aria-hidden />
                  {emptyActionLabel}
                </Button>
              ) : undefined
            }
          />
        }
      >
        {view === 'kanban' ? (
          <SupportTicketsKanbanView
            columns={kanbanColumns}
            boardScope={boardScope}
            actionId={actionId}
            onMove={onKanbanMove}
            onOpenDetail={onOpenDetail}
            onReopen={onReopen}
            onColumnLoadMore={onColumnLoadMore}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <SupportTicketsListView
              tickets={tickets}
              actionId={actionId}
              onOpenDetail={onOpenDetail}
              onStatusSelect={onStatusSelect}
              onReopen={onReopen}
            />
            {hasMoreAny && onLoadMoreAll ? (
              <InfiniteScrollSentinel
                disabled={loading}
                onReach={onLoadMoreAll}
                rootMargin="240px"
              />
            ) : null}
          </div>
        )}
      </DataView>
    </>
  );
}
