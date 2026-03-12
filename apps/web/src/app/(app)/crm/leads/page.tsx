'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PageHeader,
  FilterBar,
  KanbanBoard,
  EmptyState,
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
    } catch {
      /* handled by API layer */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await leadsApi.updateStatus(id, status);
      await fetchLeads();
      if (selectedLead?.id === id) {
        const updated = await leadsApi.getById(id);
        setSelectedLead(updated);
      }
    } catch {
      /* handled by API layer */
    }
  };

  const handleUpdate = async (id: string, data: Partial<Lead>) => {
    await leadsApi.update(id, data);
    await fetchLeads();
    const updated = await leadsApi.getById(id);
    setSelectedLead(updated);
  };

  const handleDelete = async (id: string) => {
    await leadsApi.delete(id);
    setSheetOpen(false);
    setSelectedLead(null);
    await fetchLeads();
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const handleMove = async (itemId: string, _from: string, toColumn: string) => {
    await handleStatusChange(itemId, toColumn);
  };

  const kanbanColumns: KanbanColumn<Lead>[] = LEAD_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    items: leads.filter((l) => l.status === stage.key),
  }));

  const totalCount = leads.length;
  const activeCount = leads.filter((l) => !['SPAM', 'FROZEN', 'SQL'].includes(l.status)).length;

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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
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
                <TableHead>Name</TableHead>
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
                    <TableCell className="font-medium">{lead.contactName}</TableCell>
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
