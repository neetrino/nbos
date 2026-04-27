'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  FilterBar,
  KanbanBoard,
  EmptyState,
  ErrorState,
  LoadingState,
  type KanbanColumn,
} from '@/components/shared';
import { LeadCard } from '@/features/crm/components/LeadCard';
import { LeadSheet } from '@/features/crm/components/LeadSheet';
import { CreateLeadDialog } from '@/features/crm/components/CreateLeadDialog';
import { LEAD_STAGES, LEAD_SOURCES } from '@/features/crm/constants/leadPipeline';
import { leadsApi, type Lead } from '@/lib/api/leads';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { getLeadStage, getLeadSource } from '@/features/crm/constants/leadPipeline';
import { Users } from 'lucide-react';

type ViewMode = 'kanban' | 'list';

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getAll({
        pageSize: 200,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        source: filters.source && filters.source !== 'all' ? filters.source : undefined,
      });
      setLeads(data.items);
      setError(null);
    } catch {
      setError('Leads could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: string, status: string) => {
    const previousLeads = leads;
    const previousSelected = selectedLead;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      await leadsApi.updateStatus(id, status);
    } catch {
      setLeads(previousLeads);
      if (selectedLead?.id === id) {
        setSelectedLead(previousSelected);
      }
    }
  };

  const handleUpdate = async (id: string, data: Partial<Lead>) => {
    const previousLeads = leads;
    const previousSelected = selectedLead;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
    setSelectedLead((prev) => (prev?.id === id ? { ...prev, ...data } : prev));

    try {
      const updated = await leadsApi.update(id, data);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...updated, ...data } : l)));
      setSelectedLead((prev) => (prev?.id === id ? { ...updated, ...data } : prev));
    } catch {
      setLeads(previousLeads);
      setSelectedLead(previousSelected);
    }
  };

  const handleDelete = async (id: string) => {
    const previousLeads = leads;

    setSheetOpen(false);
    setSelectedLead(null);
    setLeads((prev) => prev.filter((l) => l.id !== id));

    try {
      await leadsApi.delete(id);
    } catch {
      setLeads(previousLeads);
    }
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    handleStatusChange(itemId, toColumn);
  };

  const kanbanColumns: KanbanColumn<Lead>[] = LEAD_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    items: leads.filter((l) => l.status === stage.key),
  }));

  const totalCount = leads.length;
  const activeCount = leads.filter((l) => !['SPAM', 'SQL'].includes(l.status)).length;

  const filterConfigs = [
    {
      key: 'source',
      label: 'Source',
      options: LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      key: 'status',
      label: 'Stage',
      options: LEAD_STAGES.map((s) => ({ value: s.key, label: s.label })),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0">
        <PageHeader
          title="Lead Pipeline"
          description={`${totalCount} leads total · ${activeCount} active`}
        >
          <Button variant="outline" size="icon" onClick={fetchLeads}>
            <RefreshCcw size={16} />
          </Button>
          <div className="border-border flex rounded-lg border">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('kanban')}
              className="rounded-r-none"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setView('list')}
              className="rounded-l-none"
            >
              <List size={14} />
            </Button>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Lead
          </Button>
        </PageHeader>
      </div>

      <div className="shrink-0">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search leads by name, email, phone..."
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Add your first lead to start building your pipeline"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create First Lead
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            columns={kanbanColumns}
            renderCard={(lead) => (
              <LeadCard lead={lead} onClick={handleCardClick} onStatusChange={handleStatusChange} />
            )}
            getItemId={(lead) => lead.id}
            onMove={handleMove}
            columnWidth={270}
            emptyMessage="No leads"
          />
        </div>
      ) : (
        <div className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const stage = getLeadStage(lead.status);
                const source = getLeadSource(lead.source);
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => handleCardClick(lead)}
                  >
                    <TableCell className="font-medium">{lead.name || lead.code}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.contactName}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.email ?? '—'}</TableCell>
                    <TableCell>
                      <StatusBadge label={source?.label ?? lead.source} variant="default" />
                    </TableCell>
                    <TableCell>
                      {stage && (
                        <StatusBadge
                          label={stage.label}
                          variant={stage.variant}
                          dot
                          dotColor={stage.color}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateLeadDialog open={showCreate} onOpenChange={setShowCreate} onCreated={fetchLeads} />

      <LeadSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleUpdate}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
