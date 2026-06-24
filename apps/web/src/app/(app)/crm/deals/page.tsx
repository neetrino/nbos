'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useModuleHeroSlots,
  ViewModeSwitch,
  IntegratedSearchFilters,
  KanbanBoard,
  KanbanColumnMoneyTotal,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  DeleteConfirmDialog,
  ProfileAPermanentDeleteDialog,
  useDeleteConfirm,
  type ViewModeOption,
} from '@/components/shared';
import { DealCard } from '@/features/crm/components/DealCard';
import {
  DealSheet,
  type DealSheetBlockerNavigation,
  type DealSheetStageGateHighlight,
} from '@/features/crm/components/DealSheet';
import { CreateDealDialog } from '@/features/crm/components/CreateDealDialog';
import { createDealKanbanQuickCreateConfig } from '@/features/crm/kanban/crm-kanban-quick-create';
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import { CrmPipelineScopeBanner } from '@/features/crm/components/CrmPipelineScopeBanner';
import { getLocalDealStageGateErrors } from '@/features/crm/deal-stage-gate';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import {
  DEAL_STAGES,
  DEAL_TYPES,
  getDealStage,
  formatAmount,
} from '@/features/crm/constants/dealPipeline';
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
import { dealsApi, type Deal } from '@/lib/api/deals';
import { getDealTypePresentation } from '@/lib/deal-type-visual';
import {
  getApiErrorMessage,
  isBusinessTransitionApiError,
  isStageGateApiError,
} from '@/lib/api-errors';
import {
  resolveBlockerDirectActions,
  resolveDealSheetIntentFromBlockerAction,
  type DealSheetBlockerIntent,
} from '@/features/shared/blocker-actions';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';

type ViewMode = 'kanban' | 'list';
type ConfirmVariant = 'success' | 'danger';

const DEAL_VIEW_OPTIONS: ViewModeOption<ViewMode>[] = [
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

interface PendingDealTransition {
  id: string;
  status: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant: ConfirmVariant;
}

function DealsPipelinePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] = useState<DealSheetStageGateHighlight | null>(
    null,
  );
  const [pendingTransition, setPendingTransition] = useState<PendingDealTransition | null>(null);
  const [dealBlockerNav, setDealBlockerNav] = useState<DealSheetBlockerNavigation | null>(null);
  const deleteConfirm = useDeleteConfirm();
  const permanentDeleteConfirm = useDeleteConfirm();
  const [purging, setPurging] = useState(false);
  const dealNavTokenRef = useRef(0);

  const pushDealBlockerNav = useCallback((intent: DealSheetBlockerIntent) => {
    dealNavTokenRef.current += 1;
    setDealBlockerNav({ token: dealNavTokenRef.current, intent });
  }, []);

  const clearDealBlockerNav = useCallback(() => setDealBlockerNav(null), []);

  const stripOpenDealFromUrl = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has(CRM_OPEN_DEAL_QUERY)) return;
    p.delete(CRM_OPEN_DEAL_QUERY);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { scope, setScope, isTrashView } = useListScope({
    onScopeChange: () => {
      setSheetOpen(false);
      setSelectedDeal(null);
      setStageGateHighlight(null);
      stripOpenDealFromUrl();
    },
  });

  const pushOpenDealToUrl = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(CRM_OPEN_DEAL_QUERY, id);
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealsApi.getAll({
        pageSize: 200,
        scope,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
      });
      setDeals(data.items);
      setSelectedDeal((prev) => {
        if (!prev) return prev;
        return data.items.find((deal) => deal.id === prev.id) ?? prev;
      });
      setError(null);
    } catch {
      setError('Deals could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, scope]);

  useEffect(() => {
    if (isTrashView && view === 'kanban') setView('list');
  }, [isTrashView, view]);

  const handleDealCreated = async (deal: Deal, options?: { openFull?: boolean }) => {
    setDeals((prev) => [deal, ...prev.filter((item) => item.id !== deal.id)]);
    setError(null);

    if (options?.openFull) {
      setSelectedDeal(deal);
      setDealBlockerNav(null);
      pushOpenDealToUrl(deal.id);
      setSheetOpen(true);
    }

    await fetchDeals();
  };

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const openDealId = searchParams.get(CRM_OPEN_DEAL_QUERY)?.trim() || null;
  const portfolioContactId = searchParams.get(PORTFOLIO_DEEP_LINK.contactId)?.trim() ?? null;
  const createDealFromPortfolio = searchParams.get(PORTFOLIO_DEEP_LINK.createDeal) === '1';
  const dealPrefill = useMemo(() => {
    if (!createDealFromPortfolio || !portfolioContactId) return undefined;
    return { contactId: portfolioContactId };
  }, [createDealFromPortfolio, portfolioContactId]);

  useEffect(() => {
    if (createDealFromPortfolio && portfolioContactId) {
      setShowCreate(true);
    }
  }, [createDealFromPortfolio, portfolioContactId]);

  const deepLinkDealAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkDealAttemptedRef.current = null;
  }, [openDealId]);

  useEffect(() => {
    if (!openDealId || loading) return;
    const match = deals.find((deal) => deal.id === openDealId);
    if (match) {
      setSelectedDeal(match);
      setDealBlockerNav(null);
      setSheetOpen(true);
      return;
    }
    if (deepLinkDealAttemptedRef.current === openDealId) return;
    deepLinkDealAttemptedRef.current = openDealId;
    let cancelled = false;
    void (async () => {
      try {
        const deal = await dealsApi.getById(openDealId);
        if (cancelled) return;
        setDeals((prev) => (prev.some((d) => d.id === deal.id) ? prev : [deal, ...prev]));
        setSelectedDeal(deal);
        setDealBlockerNav(null);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Deal not found or you cannot open it.');
          stripOpenDealFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openDealId, loading, deals, stripOpenDealFromUrl]);

  const showStageGateRequirements = useCallback(
    (deal: Deal, errors: ReturnType<typeof getLocalDealStageGateErrors>) => {
      setStageGateHighlight({ errors });
      setSelectedDeal(deal);
      pushOpenDealToUrl(deal.id);
      setSheetOpen(true);

      const actions = resolveBlockerDirectActions({ context: 'crm', errors });
      const firstAction = actions[0];
      if (firstAction) {
        pushDealBlockerNav(resolveDealSheetIntentFromBlockerAction(firstAction, errors));
      }
    },
    [pushDealBlockerNav, pushOpenDealToUrl],
  );

  const handleStatusChange = async (id: string, status: string) => {
    const previousDeals = deals;
    const previousSelected = selectedDeal;
    const currentDeal = previousDeals.find((deal) => deal.id === id) ?? previousSelected ?? null;

    if (currentDeal) {
      const localErrors = getLocalDealStageGateErrors(currentDeal, status);
      if (localErrors.length > 0) {
        showStageGateRequirements(currentDeal, localErrors);
        return;
      }
    }

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    if (selectedDeal?.id === id) {
      setSelectedDeal((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      const updated = await dealsApi.updateStatus(id, status);
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
      setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
      setStageGateHighlight(null);
    } catch (err) {
      setDeals(previousDeals);
      if (selectedDeal?.id === id) {
        setSelectedDeal(previousSelected);
      }
      if (isStageGateApiError(err)) {
        const blockedDeal = previousDeals.find((deal) => deal.id === id) ?? previousSelected;
        if (blockedDeal) {
          showStageGateRequirements(blockedDeal, err.errors);
          return;
        }
      }
      if (isBusinessTransitionApiError(err)) {
        toast.error(getApiErrorMessage(err, 'Deal stage change is not available.'));
        return;
      }
      setError(err instanceof Error ? err.message : 'Deal stage change was blocked.');
    }
  };

  const requestStatusChange = async (id: string, status: string) => {
    const deal = deals.find((item) => item.id === id) ?? selectedDeal;
    if (!deal || deal.status === status) return;

    if (deal.status === 'WON') {
      toast.error('Deal Won is closed and cannot be moved back.');
      return;
    }

    if (status === 'WON') {
      setPendingTransition({
        id,
        status,
        title: 'Mark Deal as Won?',
        description:
          'This can create or update downstream Order, Project and Finance records after backend gates pass.',
        confirmLabel: 'Mark as Won',
        variant: 'success',
      });
      return;
    }

    if (status === 'FAILED') {
      setPendingTransition({
        id,
        status,
        title: 'Mark Deal as Failed?',
        description:
          'This will close the Deal as failed. Confirm only if the sales opportunity is over.',
        confirmLabel: 'Mark as Failed',
        variant: 'danger',
      });
      return;
    }

    await handleStatusChange(id, status);
  };

  const handleUpdate = async (id: string, data: Partial<Deal>) => {
    const previousDeals = deals;
    const previousSelected = selectedDeal;
    const optimisticData = normalizeDealPatch(data);

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...optimisticData } : d)));
    setSelectedDeal((prev) => (prev?.id === id ? { ...prev, ...optimisticData } : prev));

    try {
      const updated = await dealsApi.update(id, data);
      setDeals((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedDeal((prev) => (prev?.id === id ? updated : prev));
    } catch (err) {
      setDeals(previousDeals);
      setSelectedDeal(previousSelected);
      throw err;
    }
  };

  const handleMoveToTrash = async (id: string) => {
    const previousDeals = deals;

    setSheetOpen(false);
    setSelectedDeal(null);
    stripOpenDealFromUrl();
    setDeals((prev) => prev.filter((d) => d.id !== id));

    try {
      await dealsApi.moveToTrash(id);
      toast.success('Deal moved to Trash');
    } catch {
      setDeals(previousDeals);
      toast.error('Could not move deal to Trash');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const restored = await dealsApi.restore(id);
      toast.success('Deal restored');
      setSelectedDeal(restored);
      await fetchDeals();
    } catch {
      toast.error('Could not restore deal');
    }
  };

  const runPermanentDelete = async () => {
    const id = permanentDeleteConfirm.target?.id;
    if (!id) return;
    setPurging(true);
    try {
      await dealsApi.permanentDelete(id);
      toast.success('Deal permanently deleted');
      permanentDeleteConfirm.clear();
      setSheetOpen(false);
      setSelectedDeal(null);
      stripOpenDealFromUrl();
      await fetchDeals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete deal');
    } finally {
      setPurging(false);
    }
  };

  const handleCardClick = (deal: Deal) => {
    clearDealBlockerNav();
    setStageGateHighlight(null);
    setSelectedDeal(deal);
    setDealBlockerNav(null);
    setSheetOpen(true);
    pushOpenDealToUrl(deal.id);
  };

  const handleOpenDealById = async (id: string) => {
    pushOpenDealToUrl(id);
    const existingDeal = deals.find((deal) => deal.id === id);
    setSelectedDeal(existingDeal ?? null);
    clearDealBlockerNav();
    setSheetOpen(true);
    const fullDeal = await dealsApi.getById(id);
    setSelectedDeal(fullDeal);
    setDeals((prev) => {
      const hasDeal = prev.some((deal) => deal.id === fullDeal.id);
      if (!hasDeal) return [fullDeal, ...prev];
      return prev.map((deal) => (deal.id === fullDeal.id ? fullDeal : deal));
    });
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    requestStatusChange(itemId, toColumn);
  };

  const handleReorder = useCallback((itemId: string, columnKey: string, toIndex: number) => {
    setDeals((prev) => reorderCrmKanbanColumn(prev, itemId, columnKey, toIndex));
  }, []);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);

  const displayDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (filters.status && filters.status !== 'all') {
        return deal.status === filters.status;
      }
      return matchesBoardLifecycleScope(deal.status, DEAL_STAGES, boardScope);
    });
  }, [deals, filters.status, boardScope]);

  const kanbanColumns = useMemo(
    () =>
      buildScopedKanbanColumns({
        items: displayDeals,
        stages: DEAL_STAGES,
        scopeValue: boardScope,
      }),
    [displayDeals, boardScope],
  );

  const dealTerminalZones = useMemo(() => buildTerminalDropZones(DEAL_STAGES), []);

  const dealKanbanQuickCreate = useMemo(
    () => createDealKanbanQuickCreateConfig(() => setShowCreate(true)),
    [],
  );

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
        key: 'type',
        label: 'Type',
        options: DEAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
      },
      {
        key: 'status',
        label: 'Stage',
        options: DEAL_STAGES.map((s) => ({ value: s.key, label: s.label })),
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
          searchPlaceholder="Search deals by code, name, contact, company, orders, marketing…"
          filters={filterConfigs}
          filterValues={{
            boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
            ...filters,
          }}
          onFilterChange={(key: string, value: string) =>
            setFilters((prev) => {
              if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
                const next = { ...prev };
                delete next.boardScope;
                return next;
              }
              return { ...prev, [key]: value };
            })
          }
          onClearAll={() => setFilters({})}
        />
      ),
      viewMode: isTrashView ? null : (
        <ViewModeSwitch value={view} onChange={setView} options={DEAL_VIEW_OPTIONS} />
      ),
      trailing: (
        <div className="flex items-center gap-2">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="deals"
          />
          {!isTrashView ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} aria-hidden />
              New Deal
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
          entityLabel="deals"
          onBackToActive={() => setScope('active')}
        />
      ) : null}
      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchDeals} />
      ) : displayDeals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={isTrashView ? 'Trash is empty' : 'No deals yet'}
          description={
            isTrashView
              ? 'Removed deals will appear here until restored or purged.'
              : 'Create your first deal or convert a qualified lead'
          }
          action={
            isTrashView ? undefined : (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Create First Deal
              </Button>
            )
          }
        />
      ) : !isTrashView && view === 'kanban' ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <CrmPipelineScopeBanner scope={boardScope as BoardLifecycleScope} pipeline="deal" />
          <KanbanBoard
            columns={kanbanColumns}
            renderCard={(deal) => (
              <DealCard
                deal={deal}
                onClick={handleCardClick}
                onStatusChange={requestStatusChange}
              />
            )}
            getItemId={(deal) => deal.id}
            onMove={handleMove}
            onReorderWithinColumn={handleReorder}
            columnWidth={270}
            emptyMessage="No deals"
            terminalDropZones={
              shouldShowTerminalDropBar(boardScope) ? dealTerminalZones : undefined
            }
            columnQuickCreate={dealKanbanQuickCreate}
            renderColumnHeader={(column) => (
              <KanbanColumnMoneyTotal column={column} getAmount={(deal) => deal.amount} />
            )}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <CrmPipelineScopeBanner scope={boardScope as BoardLifecycleScope} pipeline="deal" />
          <div className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stage</TableHead>
                  {boardScope === 'CLOSED' ? <TableHead>Closed</TableHead> : null}
                  <TableHead>Seller</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayDeals.map((deal) => {
                  const stage = getDealStage(deal.status);
                  const dealTypeVisual = getDealTypePresentation(deal.type);
                  return (
                    <TableRow
                      key={deal.id}
                      className="cursor-pointer"
                      onClick={() => handleCardClick(deal)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{deal.name || deal.code}</p>
                          <p className="text-muted-foreground text-xs">{deal.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">{formatAmount(deal.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={dealTypeVisual.label}
                          variant={dealTypeVisual.badgeVariant}
                        />
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
                          {new Date(deal.updatedAt).toLocaleDateString()}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-muted-foreground">
                        {deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CreateDealDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleDealCreated}
        prefill={dealPrefill}
      />

      <DealSheet
        deal={selectedDeal}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedDeal(null);
            setStageGateHighlight(null);
            stripOpenDealFromUrl();
          }
        }}
        onUpdate={handleUpdate}
        onStatusChange={requestStatusChange}
        isTrashView={isTrashView}
        onMoveToTrash={
          isTrashView
            ? undefined
            : (id) => {
                const deal =
                  selectedDeal?.id === id ? selectedDeal : deals.find((item) => item.id === id);
                if (!deal) return;
                deleteConfirm.request({ id, name: deal.name ?? 'Deal' });
              }
        }
        onRestore={isTrashView ? (id) => void handleRestore(id) : undefined}
        onPermanentDelete={
          isTrashView
            ? (id) => {
                const deal =
                  selectedDeal?.id === id ? selectedDeal : deals.find((item) => item.id === id);
                if (!deal) return;
                permanentDeleteConfirm.request({ id, name: deal.name ?? 'Deal' });
              }
            : undefined
        }
        onRefresh={fetchDeals}
        onOpenDeal={handleOpenDealById}
        blockerNavigation={dealBlockerNav}
        onBlockerNavigationConsumed={clearDealBlockerNav}
        stageGateHighlight={selectedDeal && stageGateHighlight ? stageGateHighlight : null}
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
        level="strong"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move deal to Trash?"
        description="The deal will be removed from the active pipeline. Type the deal name to confirm. You can restore it from Trash later."
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
        entityLabel="deal"
        isSubmitting={purging}
        onConfirm={() => void runPermanentDelete()}
      />
    </div>
  );
}

export default function DealsPipelinePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DealsPipelinePageContent />
    </Suspense>
  );
}

function normalizeDealPatch(data: Partial<Deal>): Partial<Deal> {
  const normalized: Partial<Deal> = { ...data };

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
  if (data.projectId === null) normalized.handoff = undefined;
  if (data.companyId === null) normalized.company = null;
  if (data.existingProductId === null) normalized.existingProduct = null;

  return normalized;
}
