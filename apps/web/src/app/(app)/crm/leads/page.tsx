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
  ProfileAPermanentDeleteDialog,
  useDeleteConfirm,
  type ViewModeOption,
} from '@/components/shared';
import { PAGE_HERO_MOBILE_ICON_ACTION_CLASS } from '@/components/shared/page-hero';
import { LeadCard } from '@/features/crm/components/LeadCard';
import { LeadBoardQuickCreateTask } from '@/features/crm/components/LeadBoardQuickCreateTask';
import { LeadsListTable } from '@/features/crm/components/LeadsListTable';
import {
  LeadSheet,
  type LeadSheetBlockerNavigation,
  type LeadSheetStageGateHighlight,
} from '@/features/crm/components/LeadSheet';
import { CreateLeadDialog } from '@/features/crm/components/CreateLeadDialog';
import { createLeadKanbanQuickCreateConfig } from '@/features/crm/kanban/crm-kanban-quick-create';
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import { LEAD_STAGES } from '@/features/crm/constants/leadPipeline';
import { buildLeadPipelineFilterConfigs } from '@/features/crm/filters/crm-pipeline-filter-configs';
import { resolveLeadAssignedToFilter } from '@/features/crm/filters/crm-responsible-filter';
import { useCrmResponsibleEmployeeOptions } from '@/features/crm/filters/use-crm-responsible-employee-options';
import { usePermission } from '@/lib/permissions';
import { CRM_TRASH_LIST_PAGE_SIZE } from '@/features/crm/constants/crm-kanban-column-page';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  getBoardStageKeys,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import {
  buildScopedKanbanColumns,
  buildTerminalDropZones,
  reorderCrmKanbanColumn,
  shouldShowTerminalDropBar,
} from '@/features/crm/hooks/buildCrmKanban';
import {
  useCrmStageColumnBoard,
  type CrmStageColumnFetchParams,
} from '@/features/crm/hooks/use-crm-stage-column-board';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { ClientsDirectorySettingsSheet } from '@/features/clients/components/clients-directory-settings-sheet';
import { ClientsDirectoryTrashBanner } from '@/features/clients/components/clients-directory-trash-banner';
import { useListScope } from '@/hooks/use-list-scope';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { leadsApi, type Lead } from '@/lib/api/leads';
import {
  getApiErrorMessage,
  isBusinessTransitionApiError,
  isStageGateApiError,
  type ApiFieldError,
} from '@/lib/api-errors';
import { resolveLeadSheetSectionFromErrors } from '@/features/shared/blocker-actions';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { CrmPipelineScopeBanner } from '@/features/crm/components/CrmPipelineScopeBanner';
import { getLocalLeadStageGateErrors } from '@/features/crm/lead-stage-gate';
import { CRM_OPEN_LEAD_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

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
  const [trashLeads, setTrashLeads] = useState<Lead[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = usePersistedSearchFilters(SEARCH_FILTER_PAGE_ID.crmLeads);
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [quickCreateLeadId, setQuickCreateLeadId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] = useState<LeadSheetStageGateHighlight | null>(
    null,
  );
  const [pendingTransition, setPendingTransition] = useState<PendingLeadTransition | null>(null);
  const [leadBlockerNav, setLeadBlockerNav] = useState<LeadSheetBlockerNavigation | null>(null);
  const deleteConfirm = useDeleteConfirm();
  const permanentDeleteConfirm = useDeleteConfirm();
  const [purging, setPurging] = useState(false);
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
  const isMobileViewport = useIsMobileViewport();
  const showDesktopBoardChrome = !isMobileViewport && !isTrashView;
  const effectiveView: ViewMode = isTrashView || !isMobileViewport ? view : 'kanban';
  const { me } = usePermission();
  const meId = me?.id ?? null;
  const responsibleEmployees = useCrmResponsibleEmployeeOptions();
  const assignedTo = resolveLeadAssignedToFilter(filters.responsible, meId);

  const pushOpenLeadToUrl = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(CRM_OPEN_LEAD_QUERY, id);
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (isTrashView) return [] as string[];
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(LEAD_STAGES, boardScope);
  }, [boardScope, filters.status, isTrashView]);

  const fetchLeadPage = useCallback(
    (params: CrmStageColumnFetchParams) =>
      leadsApi.getAll({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: params.search,
        source: params.source,
        assignedTo: params.assignedTo,
        scope: params.scope,
      }),
    [],
  );

  const board = useCrmStageColumnBoard<Lead>({
    stageKeys,
    listScope: scope,
    search,
    source: filters.source && filters.source !== 'all' ? filters.source : undefined,
    assignedTo,
    enabled: !isTrashView,
    fetchPage: fetchLeadPage,
  });
  const {
    items: boardItems,
    columnMeta,
    hasMoreAny,
    loading: boardLoading,
    error: boardError,
    reload: reloadBoard,
    loadMoreColumn,
    loadMoreAll,
    setItems: setBoardItems,
    upsertItem: upsertBoardItem,
    removeItem: removeBoardItem,
  } = board;

  const fetchTrashLeads = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await leadsApi.getAll({
        pageSize: CRM_TRASH_LIST_PAGE_SIZE,
        scope,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        source: filters.source && filters.source !== 'all' ? filters.source : undefined,
        assignedTo,
      });
      setTrashLeads(data.items);
      setTrashError(null);
    } catch {
      setTrashError('Leads could not be loaded. Check your connection and try again.');
    } finally {
      setTrashLoading(false);
    }
  }, [assignedTo, filters.source, filters.status, scope, search]);

  useEffect(() => {
    if (isTrashView) void fetchTrashLeads();
  }, [fetchTrashLeads, isTrashView]);

  const leads = isTrashView ? trashLeads : boardItems;
  const loading = isTrashView ? trashLoading : boardLoading;
  const error = isTrashView ? trashError : boardError;

  const setLeads = useCallback(
    (updater: (prev: Lead[]) => Lead[]) => {
      if (isTrashView) {
        setTrashLeads(updater);
        return;
      }
      setBoardItems(updater);
    },
    [setBoardItems, isTrashView],
  );

  const fetchLeads = useCallback(async () => {
    if (isTrashView) {
      await fetchTrashLeads();
      return;
    }
    await reloadBoard();
  }, [reloadBoard, fetchTrashLeads, isTrashView]);

  useEffect(() => {
    if (isTrashView && view === 'kanban') setView('list');
  }, [isTrashView, view]);

  useEffect(() => {
    setSelectedLead((prev) => {
      if (!prev) return prev;
      return leads.find((lead) => lead.id === prev.id) ?? prev;
    });
  }, [leads]);

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
  }, [openLeadId, loading, leads, setLeads, stripOpenLeadFromUrl]);

  const handleLeadCreated = async (lead: Lead, options?: { openFull?: boolean }) => {
    if (!isTrashView) upsertBoardItem(lead);
    else setTrashLeads((prev) => [lead, ...prev.filter((item) => item.id !== lead.id)]);

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
      setLeads(() => previousLeads);
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
      toast.error(err instanceof Error ? err.message : 'Lead stage change was blocked.');
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
      setLeads(() => previousLeads);
      setSelectedLead(previousSelected);
      throw err;
    }
  };

  const handleMoveToTrash = async (id: string) => {
    const previousLeads = leads;

    setSheetOpen(false);
    setSelectedLead(null);
    stripOpenLeadFromUrl();
    if (isTrashView) setTrashLeads((prev) => prev.filter((l) => l.id !== id));
    else removeBoardItem(id);

    try {
      await leadsApi.moveToTrash(id);
      toast.success('Lead moved to Trash');
    } catch {
      setLeads(() => previousLeads);
      toast.error('Could not move lead to Trash');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const restored = await leadsApi.restore(id);
      toast.success('Lead restored');
      setSelectedLead(restored);
      await fetchLeads();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not restore lead'));
    }
  };

  const runPermanentDelete = async () => {
    const id = permanentDeleteConfirm.target?.id;
    if (!id) return;
    setPurging(true);
    try {
      await leadsApi.permanentDelete(id);
      toast.success('Lead permanently deleted');
      permanentDeleteConfirm.clear();
      setSheetOpen(false);
      setSelectedLead(null);
      stripOpenLeadFromUrl();
      await fetchLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete lead');
    } finally {
      setPurging(false);
    }
  };

  const handleCardClick = (lead: Lead) => {
    setLeadBlockerNav(null);
    setSelectedLead(lead);
    setSheetOpen(true);
    pushOpenLeadToUrl(lead.id);
  };

  const handleCreateLeadTask = useCallback((lead: Lead) => {
    setQuickCreateLeadId(lead.id);
  }, []);

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    requestStatusChange(itemId, toColumn);
  };

  const handleReorder = useCallback(
    (itemId: string, columnKey: string, toIndex: number) => {
      setLeads((prev) => reorderCrmKanbanColumn(prev, itemId, columnKey, toIndex));
    },
    [setLeads],
  );

  const kanbanStages = useMemo(() => {
    if (filters.status && filters.status !== 'all') {
      return LEAD_STAGES.filter((stage) => stage.key === filters.status);
    }
    return LEAD_STAGES;
  }, [filters.status]);

  const kanbanColumns = useMemo(
    () =>
      buildScopedKanbanColumns({
        items: leads,
        stages: kanbanStages,
        scopeValue: filters.status && filters.status !== 'all' ? 'ALL' : boardScope,
        columnMeta: isTrashView ? undefined : columnMeta,
      }),
    [columnMeta, boardScope, leads, filters.status, isTrashView, kanbanStages],
  );

  const leadTerminalZones = useMemo(() => buildTerminalDropZones(LEAD_STAGES), []);

  const filterConfigs = useMemo(
    () => buildLeadPipelineFilterConfigs(responsibleEmployees, meId),
    [meId, responsibleEmployees],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search leads by name, email, phone…"
          filters={showDesktopBoardChrome ? filterConfigs : undefined}
          filterValues={
            showDesktopBoardChrome
              ? {
                  boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
                  ...filters,
                }
              : undefined
          }
          onFilterChange={
            showDesktopBoardChrome
              ? (key: string, value: string) =>
                  setFilters((prev) => {
                    if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
                      const next = { ...prev };
                      delete next.boardScope;
                      return next;
                    }
                    return { ...prev, [key]: value };
                  })
              : undefined
          }
          onClearAll={showDesktopBoardChrome ? () => setFilters({}) : undefined}
        />
      ),
      viewMode: showDesktopBoardChrome ? (
        <ViewModeSwitch value={view} onChange={setView} options={LEAD_VIEW_OPTIONS} />
      ) : null,
      trailing: (
        <div className="flex shrink-0 items-center gap-1.5">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="leads"
            triggerClassName={isMobileViewport ? PAGE_HERO_MOBILE_ICON_ACTION_CLASS : undefined}
          />
          {!isTrashView ? (
            <Button
              onClick={() => setShowCreate(true)}
              size={isMobileViewport ? 'icon-sm' : 'default'}
              aria-label="New Lead"
              className={isMobileViewport ? PAGE_HERO_MOBILE_ICON_ACTION_CLASS : undefined}
            >
              <Plus size={16} aria-hidden />
              {isMobileViewport ? null : 'New Lead'}
            </Button>
          ) : null}
        </div>
      ),
    }),
    [
      filterConfigs,
      filters,
      isTrashView,
      isMobileViewport,
      scope,
      search,
      setFilters,
      setScope,
      showDesktopBoardChrome,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-w-0 flex-col gap-5">
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
      ) : leads.length === 0 ? (
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
      ) : !isTrashView && effectiveView === 'kanban' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <CrmPipelineScopeBanner scope={boardScope as BoardLifecycleScope} pipeline="lead" />
          <KanbanBoard
            columns={kanbanColumns}
            renderCard={(lead) => (
              <LeadCard lead={lead} onClick={handleCardClick} onCreateTask={handleCreateLeadTask} />
            )}
            getItemId={(lead) => lead.id}
            onMove={handleMove}
            onReorderWithinColumn={handleReorder}
            onColumnLoadMore={loadMoreColumn}
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
          <LeadsListTable
            leads={leads}
            boardScope={boardScope as BoardLifecycleScope}
            onLeadClick={handleCardClick}
          />
          {!isTrashView && hasMoreAny ? (
            <InfiniteScrollSentinel
              disabled={boardLoading}
              onReach={loadMoreAll}
              rootMargin="240px"
            />
          ) : null}
        </div>
      )}

      <CreateLeadDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleLeadCreated}
      />

      <LeadBoardQuickCreateTask
        leadId={quickCreateLeadId}
        onClose={() => setQuickCreateLeadId(null)}
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
        onRefresh={() => void fetchLeads()}
        onMerged={(lead) => {
          setSelectedLead(lead);
          pushOpenLeadToUrl(lead.id);
          void fetchLeads();
        }}
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
        onPermanentDelete={
          isTrashView
            ? (id) => {
                const lead =
                  selectedLead?.id === id ? selectedLead : leads.find((item) => item.id === id);
                if (!lead) return;
                permanentDeleteConfirm.request({ id, name: lead.name ?? 'Lead' });
              }
            : undefined
        }
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
        forceNestedBackdrop
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleMoveToTrash(id);
        }}
      />

      <ProfileAPermanentDeleteDialog
        open={permanentDeleteConfirm.open}
        onOpenChange={permanentDeleteConfirm.onOpenChange}
        itemName={permanentDeleteConfirm.target?.name ?? ''}
        entityLabel="lead"
        isSubmitting={purging}
        onConfirm={() => void runPermanentDelete()}
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
