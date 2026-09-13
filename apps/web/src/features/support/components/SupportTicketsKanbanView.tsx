'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { KanbanBoard } from '@/components/shared';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { SupportTicketCard } from '@/features/support/components/SupportTicketCard';
import {
  translateSupportStatus,
  type SupportTranslator,
} from '@/features/support/support-message-keys';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportKanbanColumn {
  key: string;
  label: string;
  color: string;
  items: SupportTicket[];
  totalCount?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export interface SupportTicketsKanbanViewProps {
  columns: SupportKanbanColumn[];
  boardScope: BoardLifecycleScope;
  actionId: string | null;
  onMove: (itemId: string, from: string, toColumn: string) => void;
  onOpenDetail: (ticketId: string) => void;
  onReopen: (ticket: SupportTicket) => void;
  onColumnLoadMore?: (columnKey: string) => void;
}

export function SupportTicketsKanbanView({
  columns,
  boardScope,
  actionId,
  onMove,
  onOpenDetail,
  onReopen,
  onColumnLoadMore,
}: SupportTicketsKanbanViewProps) {
  const t = useTranslations('support') as SupportTranslator;

  const localizedColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        label: translateSupportStatus(t, column.key, column.label),
      })),
    [columns, t],
  );

  const terminalDropZones = useMemo(
    () =>
      buildTerminalDropZonesFromBoard(
        SUPPORT_TICKET_BOARD_STAGES,
        Object.fromEntries(
          TICKET_STATUSES.map((row) => [
            row.value,
            translateSupportStatus(t, row.value, row.label),
          ]),
        ) as Record<string, string>,
      ),
    [t],
  );

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={localizedColumns}
        getItemId={(ticket: SupportTicket) => ticket.id}
        onMove={onMove}
        onColumnLoadMore={onColumnLoadMore}
        terminalDropZones={shouldShowTerminalDropBar(boardScope) ? terminalDropZones : undefined}
        renderCard={(ticket: SupportTicket) => (
          <SupportTicketCard
            ticket={ticket}
            actionId={actionId}
            onOpenDetail={onOpenDetail}
            onReopen={onReopen}
          />
        )}
      />
    </div>
  );
}
