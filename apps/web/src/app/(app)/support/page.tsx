'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCcw,
  Headphones,
  LayoutGrid,
  List,
  FolderKanban,
  TableProperties,
  CheckSquare,
  FilePlus2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  KanbanBoard,
} from '@/components/shared';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_WAITING_STATES,
  TICKET_WAITING_OVERLAY_OPTIONS,
  getTicketCategory,
  getTicketCoverage,
  getTicketPriority,
  getTicketSlaState,
  getTicketStatus,
  getTicketWaitingState,
} from '@/features/support/constants/support';
import { supportApi, type SupportStats, type SupportTicket } from '@/lib/api/support';
import { useSupportScopeStatsCsvExport } from '@/features/support/use-support-scope-stats-csv-export';
import { usePermission } from '@/lib/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';

type ViewMode = 'kanban' | 'list';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('list');
  const [actionId, setActionId] = useState<string | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<SupportTicket | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const { me } = usePermission();

  const { handleExportScopeStatsCsv } = useSupportScopeStatsCsvExport(stats);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await supportApi.getAll({
        pageSize: 100,
        search: search || undefined,
        category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        waitingState:
          filters.waitingState && filters.waitingState !== 'all' ? filters.waitingState : undefined,
      });
      setTickets(items);
      setError(null);
      try {
        setStats(await supportApi.getStats());
      } catch {
        setStats(null);
      }
    } catch {
      setError('Support tickets could not be loaded. Check your connection and try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTickets = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));

  const filterConfigs = [
    {
      key: 'category',
      label: 'Category',
      options: TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      key: 'priority',
      label: 'Priority',
      options: TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: TICKET_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      key: 'waitingState',
      label: 'Waiting',
      options: TICKET_WAITING_STATES.map((w) => ({ value: w.value, label: w.label })),
    },
  ];

  const kanbanColumns = TICKET_STATUSES.map((status) => ({
    key: status.value,
    label: status.label,
    color: status.color,
    items: tickets.filter((t) => t.status === status.value),
  }));

  const handleCreateExecutionTask = async (ticket: SupportTicket) => {
    if (!me?.id) return;
    setActionId(ticket.id);
    try {
      await supportApi.createExecutionTask(ticket.id, { creatorId: me.id });
      await fetchTickets();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Execution task could not be created.'));
    } finally {
      setActionId(null);
    }
  };

  const handleCreateExtensionDeal = async (ticket: SupportTicket) => {
    if (!me?.id) return;
    setActionId(`deal:${ticket.id}`);
    try {
      await supportApi.createExtensionDeal(ticket.id, { sellerId: me.id });
      await fetchTickets();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Extension Deal could not be created.'));
    } finally {
      setActionId(null);
    }
  };

  const handleWaitingChange = async (ticket: SupportTicket, value: string) => {
    setActionId(`wait:${ticket.id}`);
    try {
      await supportApi.updateWaiting(ticket.id, { waitingState: value });
      await fetchTickets();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Waiting state could not be updated.'));
    } finally {
      setActionId(null);
    }
  };

  const handleSubmitEscalation = async () => {
    if (!escalateTicket) return;
    setActionId(`escalate:${escalateTicket.id}`);
    try {
      await supportApi.escalate(escalateTicket.id, escalateReason.trim() || undefined);
      setEscalateTicket(null);
      setEscalateReason('');
      await fetchTickets();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Escalation could not be recorded.'));
    } finally {
      setActionId(null);
    }
  };

  const handleReopenTicket = async (ticket: SupportTicket) => {
    setActionId(`reopen:${ticket.id}`);
    try {
      await supportApi.reopen(ticket.id);
      await fetchTickets();
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be reopened.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Support" description={`${openTickets.length} open tickets`}>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchTickets}
          aria-label="Refresh support tickets"
        >
          <RefreshCcw size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={loading || !stats}
          onClick={() => handleExportScopeStatsCsv()}
          aria-label="Export support scope statistics as CSV"
          title="UTF-8 CSV snapshot from GET /api/support/stats (workspace-wide groupBy; list filters not applied—see scope_note row)"
        >
          <TableProperties size={16} aria-hidden />
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/support/change-control">Change Control View</Link>
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-r-none"
          >
            <List size={14} />
          </Button>
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('kanban')}
            className="rounded-l-none"
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
        <Button>
          <Plus size={16} />
          New Ticket
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Open Tickets</p>
          <p className="mt-1 text-xl font-bold">{openTickets.length}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Critical (P1)</p>
          <p className="mt-1 text-xl font-bold text-red-500">
            {
              tickets.filter(
                (t) => t.priority === 'P1' && !['RESOLVED', 'CLOSED'].includes(t.status),
              ).length
            }
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Tickets</p>
          <p className="mt-1 text-xl font-bold">{tickets.length}</p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No tickets yet"
          description="Support tickets will appear here"
          action={
            <Button>
              <Plus size={16} /> Create First Ticket
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          getItemId={(t: SupportTicket) => t.id}
          renderCard={(ticket: SupportTicket) => {
            const cat = getTicketCategory(ticket.category);
            const pri = getTicketPriority(ticket.priority);
            const coverage = getTicketCoverage(ticket.coverageDecision);
            const sla = getTicketSlaState(ticket.slaState.state);
            return (
              <div className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-medium">
                    {ticket.code}
                  </span>
                  {pri && <StatusBadge label={pri.label} variant={pri.variant} />}
                </div>
                <p className="text-sm font-medium">{ticket.title}</p>
                <div className="flex items-center gap-2">
                  {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                  {ticket.billable && <StatusBadge label="Billable" variant="amber" />}
                  {ticket.product && <StatusBadge label="Product" variant="blue" />}
                </div>
                <div className="flex items-center gap-2">
                  {coverage && <StatusBadge label={coverage.label} variant={coverage.variant} />}
                  {sla && <StatusBadge label={sla.label} variant={sla.variant} />}
                </div>
                <label className="text-muted-foreground text-[10px] font-medium uppercase">
                  Waiting overlay
                </label>
                <select
                  className="border-border bg-background text-foreground w-full rounded-md border px-2 py-1.5 text-xs"
                  value={ticket.waitingState ?? 'NONE'}
                  onChange={(e) => void handleWaitingChange(ticket, e.target.value)}
                  disabled={
                    actionId === `wait:${ticket.id}` ||
                    ['RESOLVED', 'CLOSED'].includes(ticket.status)
                  }
                  aria-label="Waiting overlay"
                >
                  {TICKET_WAITING_OVERLAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {ticket.waitingReason ? (
                  <p className="text-muted-foreground line-clamp-2 text-[11px]">
                    {ticket.waitingReason}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={
                    ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                    actionId?.startsWith('escalate:')
                  }
                  onClick={() => {
                    setEscalateTicket(ticket);
                    setEscalateReason(ticket.waitingReason ?? '');
                  }}
                >
                  <AlertTriangle size={12} />
                  Escalate
                </Button>
                {ticket.project && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FolderKanban size={10} />
                    {ticket.project.name}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    !me?.id ||
                    actionId === ticket.id ||
                    ['RESOLVED', 'CLOSED'].includes(ticket.status)
                  }
                  onClick={() => void handleCreateExecutionTask(ticket)}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <CheckSquare size={12} />
                  Create task
                </Button>
                {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionId === `reopen:${ticket.id}`}
                    onClick={() => void handleReopenTicket(ticket)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <RotateCcw size={12} />
                    Reopen
                  </Button>
                )}
                <SupportChangeControlAction
                  ticket={ticket}
                  busy={actionId === `deal:${ticket.id}`}
                  disabled={!me?.id}
                  onCreateDeal={handleCreateExtensionDeal}
                />
              </div>
            );
          }}
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Escalate</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Execution</TableHead>
                <TableHead>Change Control</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const cat = getTicketCategory(ticket.category);
                const pri = getTicketPriority(ticket.priority);
                const st = getTicketStatus(ticket.status);
                const coverage = getTicketCoverage(ticket.coverageDecision);
                const sla = getTicketSlaState(ticket.slaState.state);
                const waiting = getTicketWaitingState(ticket.waitingState ?? 'NONE');
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-muted-foreground text-xs">{ticket.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat && <StatusBadge label={cat.label} variant={cat.variant} />}
                    </TableCell>
                    <TableCell>
                      {pri && <StatusBadge label={pri.label} variant={pri.variant} />}
                    </TableCell>
                    <TableCell>
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                      {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                        <div className="mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 px-2 text-xs"
                            disabled={actionId === `reopen:${ticket.id}`}
                            onClick={() => void handleReopenTicket(ticket)}
                          >
                            <RotateCcw size={10} />
                            Reopen
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {sla && <StatusBadge label={sla.label} variant={sla.variant} />}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <select
                          className="border-border bg-background text-foreground max-w-[200px] rounded-md border px-2 py-1 text-xs"
                          value={ticket.waitingState ?? 'NONE'}
                          onChange={(e) => void handleWaitingChange(ticket, e.target.value)}
                          disabled={
                            actionId === `wait:${ticket.id}` ||
                            ['RESOLVED', 'CLOSED'].includes(ticket.status)
                          }
                          aria-label="Waiting overlay"
                        >
                          {TICKET_WAITING_OVERLAY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {waiting && waiting.value !== 'NONE' ? (
                          <span className="text-muted-foreground text-[10px]">{waiting.label}</span>
                        ) : null}
                        {ticket.waitingReason ? (
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">
                            {ticket.waitingReason}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={
                          ['RESOLVED', 'CLOSED'].includes(ticket.status) ||
                          actionId === `escalate:${ticket.id}`
                        }
                        onClick={() => {
                          setEscalateTicket(ticket);
                          setEscalateReason(ticket.waitingReason ?? '');
                        }}
                      >
                        <AlertTriangle size={12} />
                        Escalate
                      </Button>
                    </TableCell>
                    <TableCell>
                      {coverage ? (
                        <StatusBadge label={coverage.label} variant={coverage.variant} />
                      ) : (
                        <StatusBadge label="Not decided" variant="gray" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.project?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.product?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ticket.assignee
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {ticket.billable ? (
                        <StatusBadge label="Paid" variant="amber" />
                      ) : (
                        <StatusBadge label="Free" variant="gray" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          !me?.id ||
                          actionId === ticket.id ||
                          ['RESOLVED', 'CLOSED'].includes(ticket.status)
                        }
                        onClick={() => void handleCreateExecutionTask(ticket)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <CheckSquare size={12} />
                        Task
                      </Button>
                    </TableCell>
                    <TableCell>
                      <SupportChangeControlAction
                        ticket={ticket}
                        busy={actionId === `deal:${ticket.id}`}
                        disabled={!me?.id}
                        onCreateDeal={handleCreateExtensionDeal}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!escalateTicket}
        onOpenChange={(open) => {
          if (!open) {
            setEscalateTicket(null);
            setEscalateReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Managerial escalation</DialogTitle>
            <DialogDescription>
              Sends in-app notifications to the assignee and users with global Support ticket
              access. The ticket is marked Escalated and the SLA clock pauses until the overlay is
              cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="support-escalate-reason">Reason</Label>
            <Textarea
              id="support-escalate-reason"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              rows={3}
              placeholder="Business risk, needs another specialist, client urgency…"
              className="resize-y"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEscalateTicket(null);
                setEscalateReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!escalateTicket || !!actionId?.startsWith('escalate:')}
              onClick={() => void handleSubmitEscalation()}
            >
              Confirm escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportChangeControlAction({
  ticket,
  busy,
  disabled,
  onCreateDeal,
}: {
  ticket: SupportTicket;
  busy: boolean;
  disabled: boolean;
  onCreateDeal: (ticket: SupportTicket) => Promise<void>;
}) {
  if (ticket.category !== 'CHANGE_REQUEST') return null;

  if (ticket.extensionDeal) {
    return (
      <StatusBadge
        label={`Deal ${ticket.extensionDeal.code}`}
        variant={ticket.extensionDeal.status === 'WON' ? 'green' : 'purple'}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={
        disabled || busy || !ticket.productId || ['RESOLVED', 'CLOSED'].includes(ticket.status)
      }
      onClick={() => void onCreateDeal(ticket)}
      className="h-7 gap-1 px-2 text-xs"
      title={ticket.productId ? 'Create Extension Deal' : 'Product context is required'}
    >
      <FilePlus2 size={12} />
      Extension deal
    </Button>
  );
}
