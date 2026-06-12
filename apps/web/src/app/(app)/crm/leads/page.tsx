'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useModuleHeroSlots,
  ViewModeSwitch,
  IntegratedSearchFilters,
  KanbanBoard,
  EmptyState,
  ErrorState,
  LoadingState,
  DeleteConfirmDialog,
  useDeleteConfirm,
  type KanbanColumn,
  type ViewModeOption,
} from '@/components/shared';
import { LeadCard } from '@/features/crm/components/LeadCard';
import {
  LeadSheet,
  type LeadSheetBlockerNavigation,
  type LeadSheetStageGateHighlight,
} from '@/features/crm/components/LeadSheet';
import { CreateLeadDialog } from '@/features/crm/components/CreateLeadDialog';
import { createLeadKanbanQuickCreateConfig } from '@/features/crm/kanban/crm-kanban-quick-create';
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import { LEAD_STAGES, LEAD_SOURCES } from '@/features/crm/constants/leadPipeline';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import {
  buildScopedKanbanColumns,
  buildTerminalDropZones,
  reorderCrmKanbanColumn,
  shouldShowTerminalDropBar,
} from '@/features/crm/hooks/buildCrmKanban';
import { ClientsDirectorySettingsSheet } from '@/features/clients/components/clients-directory-settings-sheet';
import { ClientsDirectoryTrashBanner } from '@/features/clients/components/clients-directory-trash-banner';
import { useListScope } from '@/hooks/use-list-scope';
import { leadsApi, type Lead } from '@/lib/api/leads';
import {
  getApiErrorMessage,
  isBusinessTransitionApiError,
  isStageGateApiError,
  type ApiFieldError,
} from '@/lib/api-errors';
import { resolveLeadSheetSectionFromErrors } from '@/features/shared/blocker-actions';
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
import { CrmPipelineScopeBanner } from '@/features/crm/components/CrmPipelineScopeBanner';
import { getLocalLeadStageGateErrors } from '@/features/crm/lead-stage-gate';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { CRM_OPEN_LEAD_QUERY } from '@/features/crm/constants/crm-list-sheet-url';

type ViewMode = 'kanban' | 'list';
type ConfirmVariant = 'success' | 'danger';

const LEAD_VIEW_OPTIONS: ViewModeOption<ViewMode>[] = [
  {
    value: 'kanban',
    label: 'Board',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Kanban board view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

interface PendingLeadTransition {
  id: string;
  status: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant: ConfirmVariant;
}

function LeadsPipelinePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] = useState<LeadSheetStageGateHighlight | null>(
    null,
  );
  const [pendingTransition, setPendingTransition] = useState<PendingLeadTransition | null>(null);
  const [leadBlockerNav, setLeadBlockerNav] = useState<LeadSheetBlockerNavigation | null>(null);
  const deleteConfirm = useDeleteConfirm();
  const leadNavTokenRef = useRef(0);

  const clearLeadBlockerNav = useCallback(() => setLeadBlockerNav(null), []);

  const stripOpenLeadFromUrl = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has(CRM_OPEN_LEAD_QUERY)) return;
    p.delete(CRM_OPEN_LEAD_QUERY);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { scope, setScope, isTrashView } = useListScope({
    onScopeChange: () => {
      setSheetOpen(false);
      setSelectedLead(null);
      setStageGateHighlight(null);
      stripOpenLeadFromUrl();
    },
  });

  const pushOpenLeadToUrl = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(CRM_OPEN_LEAD_QUERY, id);
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getAll({
        pageSize: 200,
        scope,
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
  }, [search, filters, scope]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (isTrashView && view === 'kanban') setView('list');
  }, [isTrashView, view]);

  const openLeadId = searchParams.get(CRM_OPEN_LEAD_QUERY)?.trim() || null;
  const deepLinkLeadAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkLeadAttemptedRef.current = null;
  }, [openLeadId]);

  useEffect(() => {
    if (!openLeadId || loading) return;
    const match = leads.find((lead) => lead.id === openLeadId);
    if (match) {
      setSelectedLead(match);
      setLeadBlockerNav(null);
      setSheetOpen(true);
      return;
    }
    if (deepLinkLeadAttemptedRef.current === openLeadId) return;
    deepLinkLeadAttemptedRef.current = openLeadId;
    let cancelled = false;
    void (async () => {
      try {
        const lead = await leadsApi.getById(openLeadId);
        if (cancelled) return;
        setLeads((prev) => (prev.some((l) => l.id === lead.id) ? prev : [lead, ...prev]));
        setSelectedLead(lead);
        setLeadBlockerNav(null);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Lead not found or you cannot open it.');
          stripOpenLeadFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openLeadId, loading, leads, stripOpenLeadFromUrl]);

  const handleLeadCreated = async (lead: Lead, options?: { openFull?: boolean }) => {
    setLeads((prev) => [lead, ...prev.filter((item) => item.id !== lead.id)]);
    setError(null);

    if (options?.openFull) {
      pushOpenLeadToUrl(lead.id);
    }

    await fetchLeads();
  };

  const showLeadStageGateRequirements = useCallback(
    (lead: Lead, errors: ApiFieldError[]) => {
      setStageGateHighlight({ errors });
      setSelectedLead(lead);
      pushOpenLeadToUrl(lead.id);
      leadNavTokenRef.current += 1;
      setLeadBlockerNav({
        token: leadNavTokenRef.current,
        sectionId: resolveLeadSheetSectionFromErrors(errors),
      });
      setSheetOpen(true);
    },
    [pushOpenLeadToUrl],
  );

  const handleStatusChange = async (id: string, status: string, leadOverride?: Lead) => {
    const previousLeads = leads;
    const previousSelected = selectedLead;
    const currentLead =
      leadOverride ?? previousLeads.find((lead) => lead.id === id) ?? previousSelected;

    if (currentLead) {
      const localErrors = getLocalLeadStageGateErrors(currentLead, status);
      if (localErrors.length > 0) {
        showLeadStageGateRequirements(currentLead, localErrors);
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
      setStageGateHighlight(null);
    } catch (err) {
      setLeads(previousLeads);
      if (selectedLead?.id === id) {
        setSelectedLead(previousSelected);
      }
      if (isStageGateApiError(err)) {
        const blockedLead = previousLeads.find((lead) => lead.id === id) ?? previousSelected;
        if (blockedLead) {
          showLeadStageGateRequirements(blockedLead, err.errors);
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
    } catch (err) {
      setLeads(previousLeads);
      setSelectedLead(previousSelected);
      throw err;
    }
  };

  const handleMoveToTrash = async (id: string) => {
    const previousLeads = leads;

    setSheetOpen(false);
    setSelectedLead(null);
    stripOpenLeadFromUrl();
    setLeads((prev) => prev.filter((l) => l.id !== id));

    try {
      await leadsApi.moveToTrash(id);
      toast.success('Lead moved to Trash');
    } catch {
      setLeads(previousLeads);
      toast.error('Could not move lead to Trash');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const restored = await leadsApi.restore(id);
      toast.success('Lead restored');
      setSelectedLead(restored);
      await fetchLeads();
    } catch {
      toast.error('Could not restore lead');
    }
  };

  const handleCardClick = (lead: Lead) => {
    setLeadBlockerNav(null);
    setSelectedLead(lead);
    setSheetOpen(true);
    pushOpenLeadToUrl(lead.id);
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    requestStatusChange(itemId, toColumn);
  };

  const handleReorder = useCallback((itemId: string, columnKey: string, toIndex: number) => {
    setLeads((prev) => reorderCrmKanbanColumn(prev, itemId, columnKey, toIndex));
  }, []);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);

  const displayLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status && filters.status !== 'all') {
        return lead.status === filters.status;
      }
      return matchesBoardLifecycleScope(lead.status, LEAD_STAGES, boardScope);
    });
  }, [leads, filters.status, boardScope]);

  const kanbanColumns = useMemo(
    () =>
      buildScopedKanbanColumns({
        items: displayLeads,
        stages: LEAD_STAGES,
        scopeValue: boardScope,
      }),
    [displayLeads, boardScope],
  );

  const leadTerminalZones = useMemo(() => buildTerminalDropZones(LEAD_STAGES), []);

  const filterConfigs = useMemo(
    () => [
      {
        key: 'boardScope',
        label: 'Status',
        includeAllOption: false,
        defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
        options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        })),
      },
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
    ],
    [],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search leads by name, email, phone…"
          filters={filterConfigs}
          filterValues={{
            boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
            ...filters,
          }}
          onFilterChange={(key: string, value: string) =>
            setFilters((prev) => {
              if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
                const { boardScope: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, [key]: value };
            })
          }
          onClearAll={() => setFilters({})}
        />
      ),
      viewMode: isTrashView ? null : (
        <ViewModeSwitch value={view} onChange={setView} options={LEAD_VIEW_OPTIONS} />
      ),
      trailing: (
        <div className="flex items-center gap-2">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="leads"
          />
          {!isTrashView ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} aria-hidden />
              New Lead
            </Button>
          ) : null}
        </div>
      ),
    }),
    [filterConfigs, filters, isTrashView, scope, search, setScope, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full flex-col gap-5">
      {isTrashView ? (
        <ClientsDirectoryTrashBanner
          entityLabel="leads"
          onBackToActive={() => setScope('active')}
        />
      ) : null}
      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchLeads} />
      ) : displayLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isTrashView ? 'Trash is empty' : 'No leads yet'}
          description={
            isTrashView
              ? 'Removed leads will appear here until restored or purged.'
              : 'Add your first lead to start building your pipeline'
          }
          action={
            isTrashView ? undefined : (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Create First Lead
              </Button>
            )
          }
        />
      ) : !isTrashView && view === 'kanban' ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <CrmPipelineScopeBanner scope={boardScope as BoardLifecycleScope} pipeline="lead" />
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
            onReorderWithinColumn={handleReorder}
            columnWidth={270}
            emptyMessage="No leads"
            columnQuickCreate={createLeadKanbanQuickCreateConfig((lead) => handleLeadCreated(lead))}
            terminalDropZones={
              shouldShowTerminalDropBar(boardScope) ? leadTerminalZones : undefined
            }
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <CrmPipelineScopeBanner scope={boardScope as BoardLifecycleScope} pipeline="lead" />
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
                  {boardScope === 'CLOSED' ? <TableHead>Closed</TableHead> : null}
                  <TableHead>Seller</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLeads.map((lead) => {
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
                      {boardScope === 'CLOSED' ? (
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(lead.updatedAt).toLocaleDateString()}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-muted-foreground">
                        {lead.assignee
                          ? `${lead.assignee.firstName} ${lead.assignee.lastName}`
                          : '—'}
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
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedLead(null);
            setStageGateHighlight(null);
            stripOpenLeadFromUrl();
          }
        }}
        onUpdate={handleUpdate}
        onStatusChange={requestStatusChange}
        isTrashView={isTrashView}
        onMoveToTrash={
          isTrashView
            ? undefined
            : (id) => {
                const lead =
                  selectedLead?.id === id ? selectedLead : leads.find((item) => item.id === id);
                if (!lead) return;
                deleteConfirm.request({ id, name: lead.name ?? 'Lead' });
              }
        }
        onRestore={isTrashView ? (id) => void handleRestore(id) : undefined}
        blockerNavigation={leadBlockerNav}
        onBlockerNavigationConsumed={clearLeadBlockerNav}
        stageGateHighlight={selectedLead && stageGateHighlight ? stageGateHighlight : null}
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

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move lead to Trash?"
        description="The lead will be removed from the active pipeline. You can restore it from Trash later."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleMoveToTrash(id);
        }}
      />
    </div>
  );
}

export default function LeadsPipelinePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LeadsPipelinePageContent />
    </Suspense>
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
