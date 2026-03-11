'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  Headphones,
  LayoutGrid,
  List,
  FolderKanban,
  User,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge, KanbanBoard } from '@/components/shared';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  getTicketCategory,
  getTicketPriority,
  getTicketStatus,
} from '@/features/support/constants/support';
import { api } from '@/lib/api';

interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  billable: boolean;
  createdAt: string;
  assignee: { id: string; firstName: string; lastName: string } | null;
  project: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
}

type ViewMode = 'kanban' | 'list';

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('list');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/support/tickets', {
        params: {
          pageSize: 100,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        },
      });
      setTickets(resp.data.items ?? resp.data ?? []);
    } catch {
      /* handled */
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

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Support" description={`${openTickets.length} open tickets`}>
        <Button variant="outline" size="icon" onClick={fetchTickets}>
          <RefreshCcw size={16} />
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
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
          getItemId={(t: Ticket) => t.id}
          renderCard={(ticket: Ticket) => {
            const cat = getTicketCategory(ticket.category);
            const pri = getTicketPriority(ticket.priority);
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
                </div>
                {ticket.project && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FolderKanban size={10} />
                    {ticket.project.name}
                  </div>
                )}
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
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const cat = getTicketCategory(ticket.category);
                const pri = getTicketPriority(ticket.priority);
                const st = getTicketStatus(ticket.status);
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
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ticket.project?.name ?? '—'}
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
