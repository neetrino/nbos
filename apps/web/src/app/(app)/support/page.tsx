'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  X,
  Headphones,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  User,
  Calendar,
} from 'lucide-react';

type TicketPriority = 'P1' | 'P2' | 'P3';
type TicketCategory = 'INCIDENT' | 'SERVICE_REQUEST' | 'CHANGE_REQUEST' | 'PROBLEM';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

interface Ticket {
  id: string;
  code: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: string;
  assignee: string | null;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  P1: { label: 'P1', color: 'bg-red-500/10 text-red-600' },
  P2: { label: 'P2', color: 'bg-orange-500/10 text-orange-600' },
  P3: { label: 'P3', color: 'bg-gray-500/10 text-gray-500' },
};

const CATEGORY_CONFIG: Record<TicketCategory, { label: string; color: string }> = {
  INCIDENT: { label: 'Incident', color: 'bg-red-500/10 text-red-600' },
  SERVICE_REQUEST: { label: 'Service Request', color: 'bg-blue-500/10 text-blue-600' },
  CHANGE_REQUEST: { label: 'Change Request', color: 'bg-purple-500/10 text-purple-600' },
  PROBLEM: { label: 'Problem', color: 'bg-amber-500/10 text-amber-600' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: 'Open', color: 'bg-blue-500/10 text-blue-600', icon: AlertTriangle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  WAITING: { label: 'Waiting', color: 'bg-gray-500/10 text-gray-500', icon: Pause },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', color: 'bg-gray-500/10 text-gray-400', icon: XCircle },
};

const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    code: 'SUP-001',
    title: 'Login page returns 500 error',
    category: 'INCIDENT',
    priority: 'P1',
    status: 'IN_PROGRESS',
    slaDeadline: '2026-03-11T14:00:00Z',
    assignee: 'Arman K.',
    createdAt: '2026-03-11T08:30:00Z',
  },
  {
    id: '2',
    code: 'SUP-002',
    title: 'Request access to analytics dashboard',
    category: 'SERVICE_REQUEST',
    priority: 'P3',
    status: 'OPEN',
    slaDeadline: '2026-03-13T18:00:00Z',
    assignee: null,
    createdAt: '2026-03-10T15:00:00Z',
  },
  {
    id: '3',
    code: 'SUP-003',
    title: 'Update SSL certificate on staging',
    category: 'CHANGE_REQUEST',
    priority: 'P2',
    status: 'WAITING',
    slaDeadline: '2026-03-12T12:00:00Z',
    assignee: 'Davit S.',
    createdAt: '2026-03-09T10:00:00Z',
  },
  {
    id: '4',
    code: 'SUP-004',
    title: 'Recurring memory leak in worker service',
    category: 'PROBLEM',
    priority: 'P1',
    status: 'IN_PROGRESS',
    slaDeadline: '2026-03-10T18:00:00Z',
    assignee: 'Lilit M.',
    createdAt: '2026-03-08T09:00:00Z',
  },
  {
    id: '5',
    code: 'SUP-005',
    title: 'Add new SMTP provider',
    category: 'CHANGE_REQUEST',
    priority: 'P3',
    status: 'RESOLVED',
    slaDeadline: '2026-03-15T18:00:00Z',
    assignee: 'Arman K.',
    createdAt: '2026-03-07T11:30:00Z',
  },
  {
    id: '6',
    code: 'SUP-006',
    title: 'File upload fails for >10MB',
    category: 'INCIDENT',
    priority: 'P2',
    status: 'OPEN',
    slaDeadline: '2026-03-12T09:00:00Z',
    assignee: null,
    createdAt: '2026-03-11T07:00:00Z',
  },
  {
    id: '7',
    code: 'SUP-007',
    title: 'Reset password for user account',
    category: 'SERVICE_REQUEST',
    priority: 'P3',
    status: 'CLOSED',
    slaDeadline: '2026-03-10T18:00:00Z',
    assignee: 'Davit S.',
    createdAt: '2026-03-06T14:00:00Z',
  },
];

function SlaIndicator({ deadline }: { deadline: string }) {
  const now = new Date();
  const dl = new Date(deadline);
  const breached = now > dl;
  const hoursLeft = Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${breached ? 'text-red-600' : 'text-emerald-600'}`}
    >
      <Clock size={12} />
      {breached ? 'Breached' : `${hoursLeft}h left`}
    </span>
  );
}

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Create Ticket</h2>
          <button
            onClick={onClose}
            className="hover:bg-secondary rounded-lg p-1.5 transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Title</label>
            <input
              type="text"
              placeholder="Brief description of the issue"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Category</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                <option value="INCIDENT">Incident</option>
                <option value="SERVICE_REQUEST">Service Request</option>
                <option value="CHANGE_REQUEST">Change Request</option>
                <option value="PROBLEM">Problem</option>
              </select>
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Priority</label>
              <select className="border-input bg-card text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none">
                <option value="P3">P3 — Low</option>
                <option value="P2">P2 — Medium</option>
                <option value="P1">P1 — High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1.5 block text-xs font-medium">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description..."
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch =
      !search ||
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const openCount = MOCK_TICKETS.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
  ).length;
  const breachedCount = MOCK_TICKETS.filter(
    (t) => new Date() > new Date(t.slaDeadline) && t.status !== 'CLOSED' && t.status !== 'RESOLVED',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Support</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {openCount} open &middot; {breachedCount} SLA breached &middot; {MOCK_TICKETS.length}{' '}
            total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Ticket
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>
        <div className="relative">
          <ChevronDown
            size={14}
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'ALL')}
            className="border-input bg-card text-foreground focus:ring-ring appearance-none rounded-xl border py-2.5 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="INCIDENT">Incident</option>
            <option value="SERVICE_REQUEST">Service Request</option>
            <option value="CHANGE_REQUEST">Change Request</option>
            <option value="PROBLEM">Problem</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <Headphones size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No tickets found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Adjust your filters or create a new ticket
          </p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Ticket
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Category
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Priority
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  SLA
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Assignee
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filtered.map((ticket) => {
                const statusCfg = STATUS_CONFIG[ticket.status];
                const StatusIcon = statusCfg.icon;
                const priorityCfg = PRIORITY_CONFIG[ticket.priority];
                const categoryCfg = CATEGORY_CONFIG[ticket.category];

                return (
                  <tr key={ticket.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-foreground text-sm font-medium">{ticket.code}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{ticket.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${categoryCfg.color}`}
                      >
                        {categoryCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${priorityCfg.color}`}
                      >
                        {priorityCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SlaIndicator deadline={ticket.slaDeadline} />
                    </td>
                    <td className="px-4 py-3">
                      {ticket.assignee ? (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                          <User size={12} />
                          {ticket.assignee}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Calendar size={12} />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
