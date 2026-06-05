'use client';

import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
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
  onCreateFirst?: () => void;
  onKanbanMove: (itemId: string, from: string, toColumn: string) => void;
  onOpenDetail: (id: string) => void;
  onReopen: (ticket: SupportTicket) => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
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
  onCreateFirst,
  onKanbanMove,
  onOpenDetail,
  onReopen,
  onStatusSelect,
}: SupportTicketsPageBodyProps) {
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }
  if (tickets.length === 0) {
    return (
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
