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
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import { LeadTransitionInlineEditor } from '@/features/crm/components/LeadTransitionInlineEditor';
import {
  TransitionBlockerDialog,
  type TransitionBlockerState,
} from '@/features/crm/components/TransitionBlockerDialog';
import { LEAD_STAGES, LEAD_SOURCES } from '@/features/crm/constants/leadPipeline';
import { leadsApi, type Lead } from '@/lib/api/leads';
import {
  getApiErrorMessage,
  isBusinessTransitionApiError,
  isStageGateApiError,
  type ApiFieldError,
} from '@/lib/api-errors';
import { resolveBlockerDirectActions } from '@/features/shared/blocker-actions';
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
import { toast } from 'sonner';
import {
  isLeadAttributionLocked,
  requiresMarketingWhichOneSelection,
} from '@nbos/shared/constants';

type ViewMode = 'kanban' | 'list';
type ConfirmVariant = 'success' | 'danger';

interface PendingLeadTransition {
  id: string;
  status: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant: ConfirmVariant;
}

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
  const [transitionBlocker, setTransitionBlocker] = useState<TransitionBlockerState<Lead> | null>(
    null,
  );
  const [pendingTransition, setPendingTransition] = useState<PendingLeadTransition | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [blockerEditorRevision, setBlockerEditorRevision] = useState(0);

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

  const handleLeadCreated = async (lead: Lead, options?: { openFull?: boolean }) => {
    setLeads((prev) => [lead, ...prev.filter((item) => item.id !== lead.id)]);
    setError(null);

    if (options?.openFull) {
      setSelectedLead(lead);
      setSheetOpen(true);
    }

    await fetchLeads();
  };

  const handleStatusChange = async (id: string, status: string, leadOverride?: Lead) => {
    const previousLeads = leads;
    const previousSelected = selectedLead;
    const currentLead =
      leadOverride ?? previousLeads.find((lead) => lead.id === id) ?? previousSelected;

    if (currentLead) {
      const localErrors = getLocalLeadTransitionErrors(currentLead, status);
      if (localErrors.length > 0) {
        setTransitionBlocker({
          item: currentLead,
          targetStatus: status,
          targetLabel: getLeadStage(status)?.label ?? status,
          errors: localErrors,
          message: `Lead cannot move to ${getLeadStage(status)?.label ?? status}: missing required fields`,
        });
        return;
      }
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      const updatedLead = await leadsApi.updateStatus(id, status);
      setLeads((prev) => prev.map((lead) => (lead.id === id ? updatedLead : lead)));
      if (selectedLead?.id === id) {
        setSelectedLead(updatedLead);
      }
    } catch (err) {
      setLeads(previousLeads);
      if (selectedLead?.id === id) {
        setSelectedLead(previousSelected);
      }
      if (isStageGateApiError(err)) {
        const blockedLead = previousLeads.find((lead) => lead.id === id) ?? previousSelected;
        if (blockedLead) {
          setTransitionBlocker({
            item: blockedLead,
            targetStatus: status,
            targetLabel: getLeadStage(status)?.label ?? status,
            errors: err.errors,
            message: err.message,
          });
          return;
        }
      }
      if (isBusinessTransitionApiError(err)) {
        toast.error(getApiErrorMessage(err, 'Lead stage change is not available.'));
        return;
      }
      setError(err instanceof Error ? err.message : 'Lead stage change was blocked.');
    }
  };

  const requestStatusChange = async (id: string, status: string) => {
    const lead = leads.find((item) => item.id === id) ?? selectedLead;
    if (!lead || lead.status === status) return;

    if (lead.status === 'SQL') {
      toast.error('Lead Won is closed. Create a new Lead if this was closed by mistake.');
      return;
    }

    if (lead.status === 'SPAM' && status === 'SQL') {
      toast.error('Restore the Lead to an active stage before qualifying it as Lead Won.');
      return;
    }

    if (status === 'SPAM') {
      setPendingTransition({
        id,
        status,
        title: 'Mark Lead as Spam?',
        description:
          'This will close the Lead as spam. You can restore it later if it was moved by mistake.',
        confirmLabel: 'Mark as Spam',
        variant: 'danger',
      });
      return;
    }

    if (status === 'SQL') {
      setPendingTransition({
        id,
        status,
        title: 'Qualify Lead as Won?',
        description:
          'This will close the Lead as a qualified Lead and create a Deal when required fields pass validation.',
        confirmLabel: 'Qualify Lead',
        variant: 'success',
      });
      return;
    }

    await handleStatusChange(id, status);
  };

  const handleOpenBlockedLead = () => {
    if (!transitionBlocker) return;
    const currentLead = leads.find((lead) => lead.id === transitionBlocker.item.id);
    setSelectedLead(currentLead ?? transitionBlocker.item);
    setSheetOpen(true);
  };

  const blockerActions = transitionBlocker
    ? resolveBlockerDirectActions({ context: 'crm', errors: transitionBlocker.errors }).map(
        (action) => ({
          key: action.key,
          label: action.label,
          onClick: handleOpenBlockedLead,
        }),
      )
    : [];

  const handleRetryBlockedMove = async () => {
    const blocker = transitionBlocker;
    if (!blocker) return;
    await handleStatusChange(blocker.item.id, blocker.targetStatus);
    setTransitionBlocker((current) => (current === blocker ? null : current));
  };

  const handleSaveBlockedLeadOnly = async (data: Partial<Lead>) => {
    const blocker = transitionBlocker;
    if (!blocker) return;

    if (Object.keys(data).length === 0) {
      toast.info('No changes to save.');
      return;
    }

    setInlineSaving(true);
    try {
      const updated = await leadsApi.update(blocker.item.id, data);
      setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
      setSelectedLead((prev) => (prev?.id === updated.id ? updated : prev));
      const nextErrors = getLocalLeadTransitionErrors(updated, blocker.targetStatus);
      setTransitionBlocker((current) =>
        current && current.item.id === updated.id
          ? { ...current, item: updated, errors: nextErrors }
          : current,
      );
      setBlockerEditorRevision((n) => n + 1);
      if (nextErrors.length === 0) {
        toast.success('Lead saved. You can move the card when ready.');
      }
    } catch (err) {
      if (isStageGateApiError(err)) {
        setTransitionBlocker((current) => (current ? { ...current, errors: err.errors } : current));
        toast.error(getApiErrorMessage(err, 'Could not save lead.'));
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Could not save lead.');
    } finally {
      setInlineSaving(false);
    }
  };

  const handleSaveBlockedLeadAndMove = async (data: Partial<Lead>) => {
    const blocker = transitionBlocker;
    if (!blocker) return;

    setInlineSaving(true);
    try {
      const updated = await leadsApi.update(blocker.item.id, data);
      setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
      setSelectedLead((prev) => (prev?.id === updated.id ? updated : prev));
      setTransitionBlocker((current) => (current ? { ...current, item: updated } : current));
      await handleStatusChange(updated.id, blocker.targetStatus, updated);
      setTransitionBlocker(null);
    } catch (err) {
      if (isStageGateApiError(err)) {
        setTransitionBlocker((current) => (current ? { ...current, errors: err.errors } : current));
        toast.error(getApiErrorMessage(err, 'Could not save lead.'));
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Lead update failed.');
    } finally {
      setInlineSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Lead>) => {
    const previousLeads = leads;
    const previousSelected = selectedLead;
    const optimisticData = normalizeLeadPatch(data);

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...optimisticData } : l)));
    setSelectedLead((prev) => (prev?.id === id ? { ...prev, ...optimisticData } : prev));

    try {
      const updated = await leadsApi.update(id, data);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setSelectedLead((prev) => (prev?.id === id ? updated : prev));
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
    requestStatusChange(itemId, toColumn);
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
              <LeadCard
                lead={lead}
                onClick={handleCardClick}
                onStatusChange={requestStatusChange}
              />
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
                      <StatusBadge label={source?.label ?? 'No source'} variant="default" />
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

      <CreateLeadDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleLeadCreated}
      />

      <LeadSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleUpdate}
        onStatusChange={requestStatusChange}
        onDelete={handleDelete}
      />

      <TransitionBlockerDialog
        open={Boolean(transitionBlocker)}
        blocker={transitionBlocker}
        entityLabel="Lead"
        itemLabel={transitionBlocker?.item.name ?? transitionBlocker?.item.code ?? ''}
        onOpenChange={(open) => {
          if (!open) setTransitionBlocker(null);
        }}
        onOpenDetails={handleOpenBlockedLead}
        onRetry={handleRetryBlockedMove}
        directActions={blockerActions}
        inlineOnly
        inlineEditor={
          transitionBlocker ? (
            <LeadTransitionInlineEditor
              key={`${transitionBlocker.item.id}-${transitionBlocker.targetStatus}-${blockerEditorRevision}`}
              lead={transitionBlocker.item}
              targetStatus={transitionBlocker.targetStatus}
              errors={transitionBlocker.errors}
              saving={inlineSaving}
              onSaveOnly={handleSaveBlockedLeadOnly}
              onSaveAndMove={handleSaveBlockedLeadAndMove}
            />
          ) : null
        }
      />

      <StageTransitionConfirmDialog
        open={Boolean(pendingTransition)}
        title={pendingTransition?.title ?? ''}
        description={pendingTransition?.description ?? ''}
        confirmLabel={pendingTransition?.confirmLabel ?? 'Confirm'}
        variant={pendingTransition?.variant ?? 'success'}
        onOpenChange={(open) => {
          if (!open) setPendingTransition(null);
        }}
        onConfirm={() => {
          const transition = pendingTransition;
          if (!transition) return;
          setPendingTransition(null);
          handleStatusChange(transition.id, transition.status);
        }}
      />
    </div>
  );
}

function normalizeLeadPatch(data: Partial<Lead>): Partial<Lead> {
  const normalized: Partial<Lead> = { ...data };

  if (data.source === null) {
    normalized.sourceDetail = null;
    normalized.sourcePartnerId = null;
    normalized.sourcePartner = null;
    normalized.sourceContactId = null;
    normalized.sourceContact = null;
    normalized.marketingAccountId = null;
    normalized.marketingAccount = null;
    normalized.marketingActivityId = null;
    normalized.marketingActivity = null;
  }
  if (data.sourceDetail === null) {
    normalized.marketingAccountId = null;
    normalized.marketingAccount = null;
    normalized.marketingActivityId = null;
    normalized.marketingActivity = null;
  }
  if (data.sourcePartnerId === null) normalized.sourcePartner = null;
  if (data.sourceContactId === null) normalized.sourceContact = null;
  if (data.marketingAccountId === null) normalized.marketingAccount = null;
  if (data.marketingActivityId === null) normalized.marketingActivity = null;

  return normalized;
}

function getLocalLeadTransitionErrors(lead: Lead, targetStatus: string): ApiFieldError[] {
  const errors: ApiFieldError[] = [];

  if (!requiresAttribution(targetStatus)) return errors;

  errors.push(...getLocalAttributionErrors(lead));

  if (targetStatus === 'SQL') {
    if (!lead.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Inquiry title (product/service) is required before Lead Won / Deal',
      });
    }
    if (!lead.contactName.trim()) {
      errors.push({ field: 'contactName', message: 'Contact name is required' });
    }
    if (!lead.phone && !lead.email) {
      errors.push({ field: 'contactMethod', message: 'Phone or email is required' });
    }
    if (!lead.assignedTo) {
      errors.push({ field: 'assignedTo', message: 'Assigned Seller is required to create a Deal' });
    }
  }

  return errors;
}

function getLocalAttributionErrors(lead: Lead): ApiFieldError[] {
  if (!lead.source) return [{ field: 'source', message: 'From is required' }];

  if ((lead.source === 'MARKETING' || lead.source === 'SALES') && !lead.sourceDetail) {
    return [{ field: 'sourceDetail', message: 'Where is required for this source' }];
  }
  if (lead.source === 'PARTNER' && !lead.sourcePartnerId) {
    return [{ field: 'sourcePartnerId', message: 'Partner must be selected' }];
  }
  if (lead.source === 'CLIENT' && !lead.sourceContactId) {
    return [{ field: 'sourceContactId', message: 'Client/referral contact must be selected' }];
  }
  if (
    requiresMarketingWhichOneSelection(lead.source, lead.sourceDetail) &&
    !lead.marketingAccountId &&
    !lead.marketingActivityId
  ) {
    return [{ field: 'whichOne', message: 'Which one is required for this marketing channel' }];
  }

  return [];
}

function requiresAttribution(status: string): boolean {
  return isLeadAttributionLocked(status);
}
