'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  User,
  ChevronRight,
  MoreHorizontal,
  RefreshCcw,
} from 'lucide-react';
import { leadsApi, type Lead } from '@/lib/api/leads';

const LEAD_STATUSES = [
  { key: 'NEW', label: 'New', color: 'bg-blue-500' },
  { key: 'DIDNT_GET_THROUGH', label: "Didn't Get Through", color: 'bg-gray-400' },
  { key: 'CONTACT_ESTABLISHED', label: 'Contact Established', color: 'bg-indigo-500' },
  { key: 'MQL', label: 'MQL', color: 'bg-purple-500' },
  { key: 'SPAM', label: 'Spam', color: 'bg-red-400' },
  { key: 'FROZEN', label: 'Frozen', color: 'bg-cyan-500' },
  { key: 'SQL', label: 'SQL', color: 'bg-emerald-500' },
] as const;

const LEAD_SOURCES = [
  'WEBSITE',
  'INSTAGRAM',
  'LINKEDIN',
  'REFERRAL',
  'COLD_CALL',
  'PARTNER',
  'EXHIBITION',
  'OTHER',
] as const;

function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusIdx = LEAD_STATUSES.findIndex((s) => s.key === lead.status);
  const nextStatus = LEAD_STATUSES[statusIdx + 1];

  return (
    <div className="group border-border bg-card rounded-xl border p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground text-xs font-medium">{lead.code}</p>
          <h4 className="text-foreground mt-1 text-sm font-semibold">{lead.contactName}</h4>
        </div>
        <button className="hover:bg-secondary rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {lead.phone && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Phone size={12} />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Mail size={12} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.assignee && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <User size={12} />
            <span>
              {lead.assignee.firstName} {lead.assignee.lastName}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium">
          {lead.source}
        </span>
        {nextStatus && lead.status !== 'SPAM' && (
          <button
            onClick={() => onStatusChange(lead.id, nextStatus.key)}
            className="bg-accent/10 text-accent hover:bg-accent/20 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
          >
            <ChevronRight size={10} />
            {nextStatus.label}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<string>('WEBSITE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadsApi.create({
        contactName,
        phone: phone || undefined,
        email: email || undefined,
        source,
        notes: notes || undefined,
      });
      onCreated();
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <h3 className="text-foreground text-lg font-semibold">New Lead</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Contact Name *</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="John Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                placeholder="+374..."
              />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Source *</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="Any additional info..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:bg-secondary rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !contactName}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getAll({
        pageSize: 200,
        search: search || undefined,
      });
      setLeads(data.items);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await leadsApi.updateStatus(id, status);
      await fetchLeads();
    } catch {
      /* empty */
    }
  };

  const groupedLeads = LEAD_STATUSES.map((status) => ({
    ...status,
    leads: leads.filter((l) => l.status === status.key),
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Lead Pipeline</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {leads.length} leads total &middot; Track and manage your pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors">
            <Filter size={16} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, phone..."
            className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="mt-6 flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : (
          <div className="flex gap-4 pb-4" style={{ minWidth: `${LEAD_STATUSES.length * 280}px` }}>
            {groupedLeads.map((column) => (
              <div key={column.key} className="w-[270px] flex-shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${column.color}`} />
                  <h3 className="text-foreground text-sm font-semibold">{column.label}</h3>
                  <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-2 py-0.5 text-xs font-medium">
                    {column.leads.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {column.leads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
                  ))}
                  {column.leads.length === 0 && (
                    <div className="border-border rounded-xl border border-dashed p-6 text-center">
                      <p className="text-muted-foreground text-xs">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={fetchLeads} />
      )}
    </div>
  );
}
