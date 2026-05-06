'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  getTicketCategory,
  getTicketCoverage,
  getTicketPriority,
  getTicketSlaState,
  getTicketStatus,
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
