'use client';

import { FolderKanban, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import {
  getTicketCategory,
  getTicketPriority,
  getTicketSlaState,
} from '@/features/support/constants/support';
import { isSupportInteractiveTarget } from '@/features/support/utils/is-support-interactive-target';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportTicketCardProps {
  ticket: SupportTicket;
  actionId?: string | null;
  onOpenDetail: (ticketId: string) => void;
  onReopen?: (ticket: SupportTicket) => void;
  showProject?: boolean;
}

export function SupportTicketCard({
  ticket,
  actionId = null,
  onOpenDetail,
  onReopen,
  showProject = true,
}: SupportTicketCardProps) {
  const category = getTicketCategory(ticket.category);
  const priority = getTicketPriority(ticket.priority);
  const sla = getTicketSlaState(ticket.slaState.state);
  const terminal = ['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <div
      className="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
      onClick={(event) => {
        if (isSupportInteractiveTarget(event.target)) {
          return;
        }
        onOpenDetail(ticket.id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground shrink-0 text-[10px] font-medium">
          {ticket.code}
        </span>
        {priority ? <StatusBadge label={priority.label} variant={priority.variant} /> : null}
      </div>
      <p className="line-clamp-2 text-sm leading-snug font-medium">{ticket.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {category ? <StatusBadge label={category.label} variant={category.variant} /> : null}
        {sla ? <StatusBadge label={sla.label} variant={sla.variant} /> : null}
      </div>
      {showProject && ticket.project ? (
        <div className="text-muted-foreground border-border flex min-w-0 items-center gap-1 border-t pt-2 text-[11px]">
          <FolderKanban size={10} className="shrink-0" aria-hidden />
          <span className="truncate">{ticket.project.name}</span>
        </div>
      ) : null}
      {terminal && onReopen ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 h-7 w-full gap-1 text-xs"
          disabled={actionId === `reopen:${ticket.id}`}
          onClick={(event) => {
            event.stopPropagation();
            onReopen(ticket);
          }}
        >
          <RotateCcw size={12} aria-hidden />
          Reopen
        </Button>
      ) : null}
    </div>
  );
}
