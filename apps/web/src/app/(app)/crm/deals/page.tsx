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
  DeleteConfirmDialog,
  ProfileAPermanentDeleteDialog,
  useDeleteConfirm,
  type ViewModeOption,
} from '@/components/shared';
import { DealCard } from '@/features/crm/components/DealCard';
import { DealsListTable } from '@/features/crm/components/DealsListTable';
import {
  DealSheet,
  type DealSheetBlockerNavigation,
  type DealSheetStageGateHighlight,
} from '@/features/crm/components/DealSheet';
import { CreateDealDialog } from '@/features/crm/components/CreateDealDialog';
import { createDealKanbanQuickCreateConfig } from '@/features/crm/kanban/crm-kanban-quick-create';
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import { WonWhatsAppGatePanel } from '@/features/crm/components/WonWhatsAppGatePanel';
import {
  isWhatsAppWonGateDealType,
  type DealWonWhatsAppPayload,
} from '@/features/crm/deal-won-whatsapp-gate';
import { CrmPipelineScopeBanner } from '@/features/crm/components/CrmPipelineScopeBanner';
import { getLocalDealStageGateErrors } from '@/features/crm/deal-stage-gate';
import { DEAL_STAGES } from '@/features/crm/constants/dealPipeline';
import { buildDealPipelineFilterConfigs } from '@/features/crm/filters/crm-pipeline-filter-configs';
import { resolveDealResponsibilityQuery } from '@/features/crm/filters/crm-responsible-filter';
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
import { dealsApi, type Deal } from '@/lib/api/deals';
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
import { toast } from 'sonner';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

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

const DEAL_SEARCH_PLACEHOLDER = 'Search deals by code, name, contact, company, orders, marketing…';
const DEAL_SEARCH_PLACEHOLDER_MOBILE = 'Search deals by code…';
const DEAL_SEARCH_MOBILE_CLASS = '[&>div]:min-h-9';

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
  const [trashDeals, setTrashDeals] = useState<Deal[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = usePersistedSearchFilters(SEARCH_FILTER_PAGE_ID.crmDeals);
  const [view, setView] = useState<ViewMode>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wonWhatsApp, setWonWhatsApp] = useState<{
    satisfied: boolean;
    payload: DealWonWhatsAppPayload | null;
  }>({ satisfied: true, payload: null });
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
  const isMobileViewport = useIsMobileViewport();
  const showDesktopBoardChrome = !isMobileViewport && !isTrashView;
  const effectiveView: ViewMode = isTrashView || !isMobileViewport ? view : 'kanban';
  const { me } = usePermission();
  const meId = me?.id ?? null;
  const responsibleEmployees = useCrmResponsibleEmployeeOptions();
  const dealResponsibility = resolveDealResponsibilityQuery(filters.responsible, meId);

  const pushOpenDealToUrl = useCallback(
    (id: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(CRM_OPEN_DEAL_QUERY, id);
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (isTrashView) return [] as string[];
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(DEAL_STAGES, boardScope);
  }, [boardScope, filters.status, isTrashView]);

  const fetchDealPage = useCallback(
    (params: CrmStageColumnFetchParams) =>
      dealsApi.getAll({
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        search: params.search,
        type: params.type,
        sellerId: params.sellerId,
        sellerAssistantId: params.sellerAssistantId,
        involvedEmployeeId: params.involvedEmployeeId,
        scope: params.scope,
      }),
    [],
  );

  const board = useCrmStageColumnBoard<Deal>({
    stageKeys,
    listScope: scope,
    search,
    type: filters.type && filters.type !== 'all' ? filters.type : undefined,
    sellerId: dealResponsibility.sellerId,
    sellerAssistantId: dealResponsibility.sellerAssistantId,
    involvedEmployeeId: dealResponsibility.involvedEmployeeId,
    enabled: !isTrashView,
    fetchPage: fetchDealPage,
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

  const fetchTrashDeals = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await dealsApi.getAll({
        pageSize: CRM_TRASH_LIST_PAGE_SIZE,
        scope,
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        sellerId: dealResponsibility.sellerId,
        sellerAssistantId: dealResponsibility.sellerAssistantId,
        involvedEmployeeId: dealResponsibility.involvedEmployeeId,
      });
      setTrashDeals(data.items);
      setTrashError(null);
    } catch {
      setTrashError('Deals could not be loaded. Check your connection and try again.');
    } finally {
      setTrashLoading(false);
    }
  }, [dealResponsibility, filters.status, filters.type, scope, search]);

  useEffect(() => {
    if (isTrashView) void fetchTrashDeals();
  }, [fetchTrashDeals, isTrashView]);

  const deals = isTrashView ? trashDeals : boardItems;
  const loading = isTrashView ? trashLoading : boardLoading;
  const error = isTrashView ? trashError : boardError;

  const setDeals = useCallback(
    (updater: (prev: Deal[]) => Deal[]) => {
      if (isTrashView) {
        setTrashDeals(updater);
        return;
      }
      setBoardItems(updater);
    },
    [setBoardItems, isTrashView],
  );

  const fetchDeals = useCallback(async () => {
    if (isTrashView) {
      await fetchTrashDeals();
      return;
    }
    await reloadBoard();
  }, [reloadBoard, fetchTrashDeals, isTrashView]);

  useEffect(() => {
    if (isTrashView && view === 'kanban') setView('list');
  }, [isTrashView, view]);

  useEffect(() => {
    setSelectedDeal((prev) => {
      if (!prev) return prev;
      return deals.find((deal) => deal.id === prev.id) ?? prev;
    });
  }, [deals]);

  const handleDealCreated = async (deal: Deal, options?: { openFull?: boolean }) => {
    if (!isTrashView) upsertBoardItem(deal);
    else setTrashDeals((prev) => [deal, ...prev.filter((item) => item.id !== deal.id)]);

    if (options?.openFull) {
      setSelectedDeal(deal);
      setDealBlockerNav(null);
      pushOpenDealToUrl(deal.id);
      setSheetOpen(true);
    }

    await fetchDeals();
  };
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
  }, [openDealId, loading, deals, setDeals, stripOpenDealFromUrl]);

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

  const handleStatusChange = async (
    id: string,
    status: string,
    whatsapp?: DealWonWhatsAppPayload | null,
  ) => {
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
      const updated = await dealsApi.updateStatus(id, status, {
        whatsappAction: whatsapp?.action,
        whatsappGroupChatId: whatsapp?.groupChatId,
      });
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
      setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
      setStageGateHighlight(null);
    } catch (err) {
      setDeals(() => previousDeals);
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
      toast.error(err instanceof Error ? err.message : 'Deal stage change was blocked.');
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
      setWonWhatsApp({
        satisfied: !isWhatsAppWonGateDealType(deal.type),
        payload: null,
      });
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
      setDeals(() => previousDeals);
      setSelectedDeal(previousSelected);
      throw err;
    }
  };

  const handleMoveToTrash = async (id: string) => {
    const previousDeals = deals;

    setSheetOpen(false);
    setSelectedDeal(null);
    stripOpenDealFromUrl();
    if (isTrashView) setTrashDeals((prev) => prev.filter((d) => d.id !== id));
    else removeBoardItem(id);

    try {
      await dealsApi.moveToTrash(id);
      toast.success('Deal moved to Trash');
    } catch {
      setDeals(() => previousDeals);
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
    if (isTrashView) {
      setTrashDeals((prev) => {
        const hasDeal = prev.some((deal) => deal.id === fullDeal.id);
        if (!hasDeal) return [fullDeal, ...prev];
        return prev.map((deal) => (deal.id === fullDeal.id ? fullDeal : deal));
      });
      return;
    }
    upsertBoardItem(fullDeal);
  };

  const handleMove = (itemId: string, _from: string, toColumn: string) => {
    requestStatusChange(itemId, toColumn);
  };

  const handleReorder = useCallback(
    (itemId: string, columnKey: string, toIndex: number) => {
      setDeals((prev) => reorderCrmKanbanColumn(prev, itemId, columnKey, toIndex));
    },
    [setDeals],
  );

  const kanbanStages = useMemo(() => {
    if (filters.status && filters.status !== 'all') {
      return DEAL_STAGES.filter((stage) => stage.key === filters.status);
    }
    return DEAL_STAGES;
  }, [filters.status]);

  const kanbanColumns = useMemo(
    () =>
      buildScopedKanbanColumns({
        items: deals,
        stages: kanbanStages,
        scopeValue: filters.status && filters.status !== 'all' ? 'ALL' : boardScope,
        columnMeta: isTrashView ? undefined : columnMeta,
      }),
    [columnMeta, boardScope, deals, filters.status, isTrashView, kanbanStages],
  );

  const dealTerminalZones = useMemo(() => buildTerminalDropZones(DEAL_STAGES), []);

  const dealKanbanQuickCreate = useMemo(
    () => createDealKanbanQuickCreateConfig(() => setShowCreate(true)),
    [],
  );

  const filterConfigs = useMemo(
    () => buildDealPipelineFilterConfigs(responsibleEmployees, meId),
    [meId, responsibleEmployees],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            isMobileViewport ? DEAL_SEARCH_PLACEHOLDER_MOBILE : DEAL_SEARCH_PLACEHOLDER
          }
          className={isMobileViewport ? DEAL_SEARCH_MOBILE_CLASS : undefined}
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
        <ViewModeSwitch value={view} onChange={setView} options={DEAL_VIEW_OPTIONS} />
      ) : null,
      trailing: (
        <div className="flex shrink-0 items-center gap-1.5">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="deals"
          />
          {!isTrashView ? (
            <Button
              onClick={() => setShowCreate(true)}
              size={isMobileViewport ? 'icon-sm' : 'default'}
              aria-label="New Deal"
            >
              <Plus size={16} aria-hidden />
              {isMobileViewport ? null : 'New Deal'}
            </Button>
          ) : null}
        </div>
      ),
    }),
    [
      filterConfigs,
      filters,
      isMobileViewport,
      isTrashView,
      scope,
      search,
      setFilters,
      setScope,
      showDesktopBoardChrome,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const pendingWonDeal = pendingTransition
    ? (deals.find((item) => item.id === pendingTransition.id) ??
      (selectedDeal?.id === pendingTransition.id ? selectedDeal : null))
    : null;

  return (
    <div className="flex h-full min-w-0 flex-col gap-5">
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
      ) : deals.length === 0 ? (
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
      ) : !isTrashView && effectiveView === 'kanban' ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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
            onColumnLoadMore={loadMoreColumn}
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
          <DealsListTable
            deals={deals}
            boardScope={boardScope as BoardLifecycleScope}
            onDealClick={handleCardClick}
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
        confirmDisabled={
          pendingTransition?.status === 'WON' &&
          Boolean(pendingWonDeal && isWhatsAppWonGateDealType(pendingWonDeal.type)) &&
          !wonWhatsApp.satisfied
        }
        onOpenChange={(open) => {
          if (!open) {
            setPendingTransition(null);
            setWonWhatsApp({ satisfied: true, payload: null });
          }
        }}
        onConfirm={() => {
          const transition = pendingTransition;
          if (!transition) return;
          setPendingTransition(null);
          handleStatusChange(transition.id, transition.status, wonWhatsApp.payload);
        }}
      >
        {pendingTransition?.status === 'WON' &&
        pendingWonDeal &&
        isWhatsAppWonGateDealType(pendingWonDeal.type) ? (
          <WonWhatsAppGatePanel
            key={pendingWonDeal.id}
            deal={pendingWonDeal}
            open
            onSatisfiedChange={(satisfied, payload) => setWonWhatsApp({ satisfied, payload })}
          />
        ) : null}
      </StageTransitionConfirmDialog>

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
