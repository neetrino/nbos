'use client';

import { useMemo } from 'react';
import { KanbanBoard } from '@/components/shared';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import { TICKET_STATUSES } from '@/features/support/constants/support';
import { SUPPORT_TICKET_BOARD_STAGES } from '@/features/support/constants/support-board-lifecycle';
import { SupportTicketCard } from '@/features/support/components/SupportTicketCard';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportKanbanColumn {
  key: string;
  label: string;
  color: string;
  items: SupportTicket[];
}

const SUPPORT_TICKET_STATUS_LABELS = Object.fromEntries(
  TICKET_STATUSES.map((row) => [row.value, row.label]),
) as Record<string, string>;

export interface SupportTicketsKanbanViewProps {
  columns: SupportKanbanColumn[];
  boardScope: BoardLifecycleScope;
  actionId: string | null;
  onMove: (itemId: string, from: string, toColumn: string) => void;
  onOpenDetail: (ticketId: string) => void;
  onReopen: (ticket: SupportTicket) => void;
}

export function SupportTicketsKanbanView({
  columns,
  boardScope,
  actionId,
  onMove,
  onOpenDetail,
  onReopen,
}: SupportTicketsKanbanViewProps) {
  const terminalDropZones = useMemo(
    () =>
      buildTerminalDropZonesFromBoard(SUPPORT_TICKET_BOARD_STAGES, SUPPORT_TICKET_STATUS_LABELS),
    [],
  );

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        getItemId={(ticket: SupportTicket) => ticket.id}
        onMove={onMove}
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
