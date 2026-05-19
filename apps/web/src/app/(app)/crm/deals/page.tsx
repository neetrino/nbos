'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, LayoutGrid, List, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useModuleHeroSlots,
  ViewModeSwitch,
  IntegratedSearchFilters,
  KanbanBoard,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  type KanbanColumn,
  type ViewModeOption,
} from '@/components/shared';
import { DealCard } from '@/features/crm/components/DealCard';
import { DealSheet, type DealSheetBlockerNavigation } from '@/features/crm/components/DealSheet';
import { CreateDealDialog } from '@/features/crm/components/CreateDealDialog';
import { DealTransitionInlineEditor } from '@/features/crm/components/DealTransitionInlineEditor';
import { StageTransitionConfirmDialog } from '@/features/crm/components/StageTransitionConfirmDialog';
import {
  TransitionBlockerDialog,
  type TransitionBlockerState,
} from '@/features/crm/components/TransitionBlockerDialog';
import {
  DEAL_STAGES,
  DEAL_TYPES,
  getDealStage,
  formatAmount,
} from '@/features/crm/constants/dealPipeline';
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

export default function DealsPipelinePage() {
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
  const [transitionBlocker, setTransitionBlocker] = useState<TransitionBlockerState<Deal> | null>(
    null,
  );
  const [pendingTransition, setPendingTransition] = useState<PendingDealTransition | null>(null);
  const [dealBlockerNav, setDealBlockerNav] = useState<DealSheetBlockerNavigation | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [blockerEditorRevision, setBlockerEditorRevision] = useState(0);
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
        search: search || undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
      });
      setDeals(data.items);
      setError(null);
    } catch {
      setError('Deals could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

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

  const handleStatusChange = async (id: string, status: string) => {
    const previousDeals = deals;
    const previousSelected = selectedDeal;

    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    if (selectedDeal?.id === id) {
      setSelectedDeal((prev) => (prev ? { ...prev, status } : prev));
    }

    try {
      const updated = await dealsApi.updateStatus(id, status);
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
      setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
    } catch (err) {
      setDeals(previousDeals);
      if (selectedDeal?.id === id) {
        setSelectedDeal(previousSelected);
      }
      if (isStageGateApiError(err)) {
        const blockedDeal = previousDeals.find((deal) => deal.id === id) ?? previousSelected;
        if (blockedDeal) {
          setTransitionBlocker({
            item: blockedDeal,
            targetStatus: status,
            targetLabel: getDealStage(status)?.label ?? status,
            errors: err.errors,
            message: err.message,
          });
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

  const openDealFromBlocker = useCallback(
    (intent?: DealSheetBlockerIntent, options?: { keepBlockerDialogOpen?: boolean }) => {
      if (!transitionBlocker) return;
      const currentDeal =
        deals.find((deal) => deal.id === transitionBlocker.item.id) ?? transitionBlocker.item;
      setSelectedDeal(currentDeal);
      pushOpenDealToUrl(currentDeal.id);
      if (intent) {
        pushDealBlockerNav(intent);
      } else {
        setDealBlockerNav(null);
      }
      setSheetOpen(true);
      if (!options?.keepBlockerDialogOpen) {
        setTransitionBlocker(null);
      }
    },
    [deals, transitionBlocker, pushDealBlockerNav, pushOpenDealToUrl],
  );

  const handleOpenBlockedDeal = () => {
    openDealFromBlocker(undefined, { keepBlockerDialogOpen: true });
  };

  const blockerActions = transitionBlocker
    ? resolveBlockerDirectActions({ context: 'crm', errors: transitionBlocker.errors }).map(
        (action) => ({
          key: action.key,
          label: action.label,
          onClick: () => {
            const intent = resolveDealSheetIntentFromBlockerAction(
              action,
              transitionBlocker.errors,
            );
            openDealFromBlocker(intent);
          },
        }),
      )
    : [];

  const hasInvoiceOrPaymentGate = useMemo(
    () =>
      transitionBlocker?.errors.some((error) => {
        const field = error.field.toLowerCase();
        return field.includes('invoice') || field.includes('payment');
      }) ?? false,
    [transitionBlocker],
  );

  const handleRetryBlockedMove = async () => {
    const blocker = transitionBlocker;
    if (!blocker) return;
    await handleStatusChange(blocker.item.id, blocker.targetStatus);
    setTransitionBlocker((current) => (current === blocker ? null : current));
  };

  const handleOverrideBlockedMove = async (reason: string) => {
    const blocker = transitionBlocker;
    if (!blocker) return;
    const updated = await dealsApi.updateStatus(blocker.item.id, blocker.targetStatus, {
      overrideReason: reason,
    });
    setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
    setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
    setTransitionBlocker(null);
    await fetchDeals();
  };

  const handleSaveBlockedDealOnly = async (data: Partial<Deal>) => {
    const blocker = transitionBlocker;
    if (!blocker) return;

    if (Object.keys(data).length === 0) {
      toast.info('No changes to save.');
      return;
    }

    setInlineSaving(true);
    try {
      const updated = await dealsApi.update(blocker.item.id, data);
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
      setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
      setTransitionBlocker((current) =>
        current && current.item.id === updated.id ? { ...current, item: updated } : current,
      );
      setBlockerEditorRevision((n) => n + 1);
      toast.success('Deal saved. You can continue stage move when ready.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save deal.'));
    } finally {
      setInlineSaving(false);
    }
  };

  const handleSaveBlockedDealAndMove = async (data: Partial<Deal>) => {
    const blocker = transitionBlocker;
    if (!blocker) return;

    setInlineSaving(true);
    try {
      const updated = await dealsApi.update(blocker.item.id, data);
      setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
      setSelectedDeal((prev) => (prev?.id === updated.id ? updated : prev));
      setTransitionBlocker((current) => (current ? { ...current, item: updated } : current));
      await handleStatusChange(updated.id, blocker.targetStatus);
      setTransitionBlocker(null);
    } catch (err) {
      if (isStageGateApiError(err)) {
        setTransitionBlocker((current) => (current ? { ...current, errors: err.errors } : current));
        toast.error(getApiErrorMessage(err, 'Could not save deal.'));
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Deal update failed.');
    } finally {
      setInlineSaving(false);
    }
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
    } catch {
      setDeals(previousDeals);
      setSelectedDeal(previousSelected);
    }
  };

  const handleDelete = async (id: string) => {
    const previousDeals = deals;

    setSheetOpen(false);
    setSelectedDeal(null);
    stripOpenDealFromUrl();
    setDeals((prev) => prev.filter((d) => d.id !== id));

    try {
      await dealsApi.delete(id);
    } catch {
      setDeals(previousDeals);
    }
  };

  const handleCardClick = (deal: Deal) => {
    clearDealBlockerNav();
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

  const kanbanColumns: KanbanColumn<Deal>[] = DEAL_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    items: deals.filter((d) => d.status === stage.key),
  }));

  const filterConfigs = useMemo(
    () => [
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
          filterValues={filters}
          onFilterChange={(key: string, value: string) =>
            setFilters((prev) => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
        />
      ),
      viewMode: <ViewModeSwitch value={view} onChange={setView} options={DEAL_VIEW_OPTIONS} />,
      trailing: (
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} aria-hidden />
          New Deal
        </Button>
      ),
    }),
    [filterConfigs, filters, search, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full flex-col gap-5">
      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchDeals} />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals yet"
          description="Create your first deal or convert a qualified lead"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create First Deal
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1">
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
            columnWidth={270}
            emptyMessage="No deals"
          />
        </div>
      ) : (
        <div className="border-border min-h-0 flex-1 overflow-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
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
      )}

      <CreateDealDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchDeals}
        prefill={dealPrefill}
      />

      <DealSheet
        deal={selectedDeal}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedDeal(null);
            stripOpenDealFromUrl();
          }
        }}
        onUpdate={handleUpdate}
        onStatusChange={requestStatusChange}
        onDelete={handleDelete}
        onRefresh={fetchDeals}
        onOpenDeal={handleOpenDealById}
        blockerNavigation={dealBlockerNav}
        onBlockerNavigationConsumed={clearDealBlockerNav}
      />

      <TransitionBlockerDialog
        open={Boolean(transitionBlocker)}
        blocker={transitionBlocker}
        entityLabel="Deal"
        itemLabel={transitionBlocker?.item.name ?? transitionBlocker?.item.code ?? ''}
        onOpenChange={(open) => {
          if (!open) setTransitionBlocker(null);
        }}
        onOpenDetails={handleOpenBlockedDeal}
        onRetry={handleRetryBlockedMove}
        directActions={blockerActions}
        onOverride={handleOverrideBlockedMove}
        inlineOnly
        inlineEditor={
          transitionBlocker ? (
            <DealTransitionInlineEditor
              key={`${transitionBlocker.item.id}-${transitionBlocker.targetStatus}-${blockerEditorRevision}`}
              deal={transitionBlocker.item}
              errors={transitionBlocker.errors}
              saving={inlineSaving}
              onSaveOnly={handleSaveBlockedDealOnly}
              onSaveAndMove={handleSaveBlockedDealAndMove}
            />
          ) : null
        }
        businessActionLabel={hasInvoiceOrPaymentGate ? 'Create invoice' : undefined}
        onBusinessAction={
          hasInvoiceOrPaymentGate
            ? () =>
                openDealFromBlocker(
                  { kind: 'invoice-tab-expand-create' },
                  {
                    keepBlockerDialogOpen: true,
                  },
                )
            : undefined
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
