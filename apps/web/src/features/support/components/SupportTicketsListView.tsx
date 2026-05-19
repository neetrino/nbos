'use client';

import { PanelRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  TICKET_STATUSES,
  getTicketCategory,
  getTicketPriority,
  getTicketSlaState,
} from '@/features/support/constants/support';
import { isSupportInteractiveTarget } from '@/features/support/utils/is-support-interactive-target';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportTicketsListViewProps {
  tickets: SupportTicket[];
  actionId: string | null;
  onOpenDetail: (ticketId: string) => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
  onReopen: (ticket: SupportTicket) => void;
}

export function SupportTicketsListView({
  tickets,
  actionId,
  onOpenDetail,
  onStatusSelect,
  onReopen,
}: SupportTicketsListViewProps) {
  return (
    <div className="border-border min-h-0 flex-1 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Ticket</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="hidden lg:table-cell">Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <SupportTicketListRow
              key={ticket.id}
              ticket={ticket}
              actionId={actionId}
              onOpenDetail={onOpenDetail}
              onStatusSelect={onStatusSelect}
              onReopen={onReopen}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SupportTicketListRow({
  ticket,
  actionId,
  onOpenDetail,
  onStatusSelect,
  onReopen,
}: {
  ticket: SupportTicket;
  actionId: string | null;
  onOpenDetail: (ticketId: string) => void;
  onStatusSelect: (ticket: SupportTicket, status: string) => void;
  onReopen: (ticket: SupportTicket) => void;
}) {
  const category = getTicketCategory(ticket.category);
  const priority = getTicketPriority(ticket.priority);
  const sla = getTicketSlaState(ticket.slaState.state);

  return (
    <TableRow
      className="hover:bg-muted/50 cursor-pointer"
      onClick={(event) => {
        if (isSupportInteractiveTarget(event.target)) {
          return;
        }
        onOpenDetail(ticket.id);
      }}
    >
      <TableCell>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{ticket.title}</p>
            <p className="text-muted-foreground text-xs">{ticket.code}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
            title="Open ticket details"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(ticket.id);
            }}
          >
            <PanelRight size={14} aria-hidden />
            Details
          </Button>
        </div>
      </TableCell>
      <TableCell>
        {category ? <StatusBadge label={category.label} variant={category.variant} /> : null}
      </TableCell>
      <TableCell>
        {priority ? <StatusBadge label={priority.label} variant={priority.variant} /> : null}
      </TableCell>
      <TableCell>
        <select
          className="border-border bg-background max-w-[168px] rounded-md border px-2 py-1 text-xs"
          value={ticket.status}
          onChange={(event) => onStatusSelect(ticket, event.target.value)}
          disabled={Boolean(actionId?.startsWith('status:'))}
          aria-label="Ticket status"
        >
          {TICKET_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {['RESOLVED', 'CLOSED'].includes(ticket.status) ? (
          <div className="mt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              disabled={actionId === `reopen:${ticket.id}`}
              onClick={() => void onReopen(ticket)}
            >
              <RotateCcw size={10} aria-hidden />
              Reopen
            </Button>
          </div>
        ) : null}
      </TableCell>
      <TableCell>{sla ? <StatusBadge label={sla.label} variant={sla.variant} /> : null}</TableCell>
      <TableCell className="text-sm">
        {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : '—'}
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
        {ticket.project?.name ?? '—'}
      </TableCell>
    </TableRow>
  );
}
