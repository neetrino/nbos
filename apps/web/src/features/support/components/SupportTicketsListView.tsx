'use client';

import { FolderKanban, PanelRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SCROLL_SHELL_CLASS,
  EntityListIconLabel,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import {
  TICKET_STATUSES,
  getTicketCategory,
  getTicketPriority,
  getTicketSlaState,
} from '@/features/support/constants/support';
import { isSupportInteractiveTarget } from '@/features/support/utils/is-support-interactive-target';
import type { SupportTicket } from '@/lib/api/support';
import { cn } from '@/lib/utils';

const PROJECT_ICON_CLASS =
  'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400';

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
    <div className={ENTITY_LIST_SCROLL_SHELL_CLASS}>
      <Table>
        <TableHeader className="bg-card sticky top-0 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(ENTITY_LIST_HEAD_CLASS, 'min-w-[200px]')}>Ticket</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Category</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Priority</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>SLA</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Assignee</TableHead>
            <TableHead className={cn(ENTITY_LIST_HEAD_CLASS, 'hidden lg:table-cell')}>
              Project
            </TableHead>
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
  const assigneeLabel = ticket.assignee
    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
    : null;

  return (
    <TableRow
      className={cn(ENTITY_LIST_ROW_HOVER_CLASS, 'cursor-pointer')}
      onClick={(event) => {
        if (isSupportInteractiveTarget(event.target)) {
          return;
        }
        onOpenDetail(ticket.id);
      }}
    >
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <div className="flex items-start justify-between gap-2">
          <EntityListPrimaryCell title={ticket.title} subtitle={ticket.code} />
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
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {category ? (
          <StatusBadge
            label={category.label}
            variant={category.variant}
            className={ENTITY_LIST_BADGE_CLASS}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {priority ? (
          <StatusBadge
            label={priority.label}
            variant={priority.variant}
            className={ENTITY_LIST_BADGE_CLASS}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <Select
          value={ticket.status}
          onValueChange={(v) => {
            if (v) onStatusSelect(ticket, v);
          }}
          disabled={Boolean(actionId?.startsWith('status:'))}
        >
          <SelectTrigger size="sm" className="max-w-[168px]" aria-label="Ticket status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {TICKET_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {sla ? (
          <StatusBadge
            label={sla.label}
            variant={sla.variant}
            className={ENTITY_LIST_BADGE_CLASS}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {assigneeLabel ? <span className="text-sm">{assigneeLabel}</span> : <EntityListMutedDash />}
      </TableCell>
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, 'hidden lg:table-cell')}>
        {ticket.project?.name ? (
          <EntityListIconLabel
            icon={FolderKanban}
            iconClassName={PROJECT_ICON_CLASS}
            label={ticket.project.name}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
    </TableRow>
  );
}
