'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { LoadingState } from '@/components/shared';
import { DeliveryBoardPageHero } from '@/features/projects/components/delivery-board/DeliveryBoardPageHero';
import { DeliveryBoardView } from '@/features/projects/components/delivery-board/DeliveryBoardView';
import { DeliveryBoardClosedBoard } from '@/features/projects/components/delivery-board/DeliveryBoardClosedBoard';
import {
  applyDeliveryBoardClosedFilters,
  buildClosedFilterOptions,
  type DeliveryBoardClosedFiltersInput,
} from '@/features/projects/components/delivery-board/delivery-board-closed-filters';
import {
  applyDeliveryBoardActiveFilters,
  buildActiveFilterOptions,
  DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS,
} from '@/features/projects/components/delivery-board/delivery-board-active-filters';
import { DeliveryBoardItemsTable } from '@/features/projects/components/delivery-board/DeliveryBoardItemsTable';
import { DeliveryItemDetailSheet } from '@/features/projects/components/delivery-board/DeliveryItemDetailSheet';
import { mergeDeliveryBoardItems } from '@/features/projects/components/delivery-board/delivery-board-item-adapters';
import {
  fetchAllExtensionsList,
  fetchAllProductsList,
} from '@/features/projects/components/delivery-board/delivery-board-list-fetch';
import {
  countDeliveryAggregates,
  filterBoardItems,
  getActiveBoardItems,
  getItemId,
  getItemKey,
  getItemLifecycle,
  getProjectId,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
} from '@/features/projects/components/delivery-board/project-delivery-board-model';
import { DELIVERY_BOARD_OPEN_ITEM_QUERY } from '@/features/projects/constants/delivery-board-open-query';
import type { ProductBoardTab } from '@/features/projects/components/delivery-board/ProjectDeliveryBoardContextLinks';
import type { DeliverySheetStageGateHighlight } from '@/features/projects/components/delivery-board/delivery-stage-gate-highlight';
import { useDeliveryBoardMutations } from '@/features/projects/components/delivery-board/use-delivery-board-mutations';
import {
  buildProductDetailPageHref,
  PRODUCT_DETAIL_TAB,
  type ProductDetailTab,
} from '@/features/projects/constants/product-detail-tab';

const DELIVERY_BOARD_PRODUCT_TAB: Record<ProductBoardTab, ProductDetailTab> = {
  tasks: PRODUCT_DETAIL_TAB.tasks,
  support: PRODUCT_DETAIL_TAB.support,
  extensions: PRODUCT_DETAIL_TAB.extensions,
};

const DEFAULT_CLOSED_FILTERS: DeliveryBoardClosedFiltersInput = {
  search: '',
  projectId: '',
  companyId: '',
  ownerId: '',
  productLineKey: '',
  closedFrom: '',
  closedTo: '',
  deadlineResult: 'ALL',
  result: 'ALL',
};

function DeliveryBoardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilterId = searchParams.get('projectId');

  const [items, setItems] = useState<DeliveryBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pipelineTab, setPipelineTab] = useState<'active' | 'closed'>('active');
  const [kindFilter, setKindFilter] = useState<DeliveryBoardKindFilter>('ALL');
  const [activeViewMode, setActiveViewMode] = useState<'LIST' | 'BOARD'>('BOARD');
  const [closedViewMode, setClosedViewMode] = useState<'LIST' | 'BOARD'>('BOARD');
  const [closedFilters, setClosedFilters] =
    useState<DeliveryBoardClosedFiltersInput>(DEFAULT_CLOSED_FILTERS);
  const [activePipelineFilters, setActivePipelineFilters] = useState(() => ({
    ...DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS,
  }));
  const [stageGateHighlight, setStageGateHighlight] =
    useState<DeliverySheetStageGateHighlight | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [products, extensions] = await Promise.all([
        fetchAllProductsList(),
        fetchAllExtensionsList(),
      ]);
      setItems(mergeDeliveryBoardItems(products, extensions));
    } catch {
      setLoadError('Could not load delivery board data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDetailItemRenamed = useCallback((updatedItem: DeliveryBoardItem) => {
    setItems((current) =>
      current.map((item) => (getItemId(item) === getItemId(updatedItem) ? updatedItem : item)),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scopedItems = useMemo(() => {
    if (!projectFilterId) return items;
    return items.filter((item) => getProjectId(item) === projectFilterId);
  }, [items, projectFilterId]);

  const openDeliveryItemKey = searchParams.get(DELIVERY_BOARD_OPEN_ITEM_QUERY)?.trim() || null;

  const detailItem = useMemo(() => {
    if (!openDeliveryItemKey) return null;
    return scopedItems.find((item) => getItemKey(item) === openDeliveryItemKey) ?? null;
  }, [openDeliveryItemKey, scopedItems]);

  const openDeliveryItemSheet = useCallback(
    (item: DeliveryBoardItem) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(DELIVERY_BOARD_OPEN_ITEM_QUERY, getItemKey(item));
      router.push(`/delivery-board?${p.toString()}`);
    },
    [router, searchParams],
  );

  const closeDeliveryItemSheet = useCallback(() => {
    setStageGateHighlight(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete(DELIVERY_BOARD_OPEN_ITEM_QUERY);
    const qs = p.toString();
    router.push(qs ? `/delivery-board?${qs}` : '/delivery-board');
  }, [router, searchParams]);

  const showStageGateRequirements = useCallback(
    (item: DeliveryBoardItem, errors: DeliverySheetStageGateHighlight['errors']) => {
      setStageGateHighlight({ errors });
      openDeliveryItemSheet(item);
    },
    [openDeliveryItemSheet],
  );

  const deliveryMutations = useDeliveryBoardMutations(load, {
    onStageGateBlocked: (item, _target, errors) => showStageGateRequirements(item, errors),
    onStageGateClear: () => setStageGateHighlight(null),
  });

  useEffect(() => {
    if (loading || !openDeliveryItemKey) return;
    const exists = scopedItems.some((item) => getItemKey(item) === openDeliveryItemKey);
    if (!exists) closeDeliveryItemSheet();
  }, [loading, openDeliveryItemKey, scopedItems, closeDeliveryItemSheet]);

  const summaryCounts = useMemo(() => countDeliveryAggregates(scopedItems), [scopedItems]);

  const activeItemsBase = useMemo(() => {
    const boardItems = filterBoardItems(scopedItems, kindFilter, 'ACTIVE');
    return getActiveBoardItems(boardItems);
  }, [scopedItems, kindFilter]);

  const activeFilterOptions = useMemo(
    () => buildActiveFilterOptions(activeItemsBase),
    [activeItemsBase],
  );

  const activeFilteredItems = useMemo(
    () => applyDeliveryBoardActiveFilters(activeItemsBase, activePipelineFilters),
    [activeItemsBase, activePipelineFilters],
  );

  const activeFilteredCount = activeFilteredItems.length;

  const closedBaseItems = useMemo(() => {
    let closed = scopedItems.filter((item) => Boolean(getItemLifecycle(item)?.isTerminal));
    if (kindFilter === 'PRODUCT') {
      closed = closed.filter((item) => item.kind === 'PRODUCT');
    } else if (kindFilter === 'EXTENSION') {
      closed = closed.filter((item) => item.kind === 'EXTENSION');
    }
    return closed;
  }, [scopedItems, kindFilter]);

  const closedFilterOptions = useMemo(
    () => buildClosedFilterOptions(closedBaseItems),
    [closedBaseItems],
  );

  const closedFilteredItems = useMemo(
    () => applyDeliveryBoardClosedFilters(closedBaseItems, closedFilters),
    [closedBaseItems, closedFilters],
  );

  const openProduct = useCallback(
    (productId: string) => {
      const target = scopedItems.find((i) => i.kind === 'PRODUCT' && i.product.id === productId);
      const pid = target && target.kind === 'PRODUCT' ? target.product.projectId : projectFilterId;
      if (pid) router.push(`/projects/${pid}/products/${productId}`);
    },
    [router, scopedItems, projectFilterId],
  );

  const openProductTab = useCallback(
    (productId: string, tab: ProductBoardTab) => {
      const target = scopedItems.find((i) => i.kind === 'PRODUCT' && i.product.id === productId);
      const pid = target && target.kind === 'PRODUCT' ? target.product.projectId : projectFilterId;
      if (pid)
        router.push(buildProductDetailPageHref(pid, productId, DELIVERY_BOARD_PRODUCT_TAB[tab]));
    },
    [router, scopedItems, projectFilterId],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {loadError && (
        <p className="text-destructive text-sm" role="alert">
          {loadError}
        </p>
      )}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading board…</p>
      ) : (
        <>
          <DeliveryBoardPageHero
            pipelineTab={pipelineTab}
            onPipelineTabChange={setPipelineTab}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            activeFilters={activePipelineFilters}
            onActiveFiltersChange={setActivePipelineFilters}
            activeFilterOptions={activeFilterOptions}
            activeFilteredCount={activeFilteredCount}
            activeTotalCount={activeItemsBase.length}
            closedFilteredCount={closedFilteredItems.length}
            closedTotalCount={closedBaseItems.length}
            closedFilters={closedFilters}
            onClosedFiltersChange={setClosedFilters}
            closedFilterOptions={closedFilterOptions}
            activeViewMode={activeViewMode}
            onActiveViewModeChange={setActiveViewMode}
            closedViewMode={closedViewMode}
            onClosedViewModeChange={setClosedViewMode}
            projectFilterId={projectFilterId}
            onClearProjectFilter={() => router.push('/delivery-board')}
          />
          <Tabs
            value={pipelineTab}
            onValueChange={(value) => setPipelineTab(value as 'active' | 'closed')}
            className="flex min-h-0 w-full flex-1 basis-0 flex-col"
          >
            <TabsContent
              value="active"
              className="mt-4 flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden"
            >
              {activeViewMode === 'LIST' ? (
                <DeliveryBoardItemsTable
                  mode="active"
                  items={activeFilteredItems}
                  onOpenDetails={openDeliveryItemSheet}
                />
              ) : (
                <DeliveryBoardView
                  items={scopedItems}
                  mutations={deliveryMutations}
                  onOpenProduct={openProduct}
                  onOpenProductTab={openProductTab}
                  lockedStatusFilter="ACTIVE"
                  summaryCounts={summaryCounts}
                  onOpenDetails={openDeliveryItemSheet}
                  showBoardHeader={false}
                  kindFilter={kindFilter}
                  onKindFilterChange={setKindFilter}
                  activePipelineFilters={activePipelineFilters}
                />
              )}
            </TabsContent>
            <TabsContent
              value="closed"
              className="mt-4 flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden"
            >
              {closedViewMode === 'LIST' ? (
                <DeliveryBoardItemsTable
                  mode="closed"
                  items={closedFilteredItems}
                  onOpenDetails={openDeliveryItemSheet}
                />
              ) : (
                <DeliveryBoardClosedBoard
                  items={closedFilteredItems}
                  busyItemId={deliveryMutations.busyItemId}
                  onOpenProduct={openProduct}
                  onOpenProductTab={openProductTab}
                  onBoardAction={deliveryMutations.handleBoardAction}
                  onCancel={deliveryMutations.requestCancel}
                  onOpenDetails={openDeliveryItemSheet}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <DeliveryItemDetailSheet
        item={detailItem}
        open={detailItem !== null}
        onOpenChange={(open) => {
          if (!open) closeDeliveryItemSheet();
        }}
        onEntityUpdated={load}
        onTitleSaved={handleDetailItemRenamed}
        boardMutations={deliveryMutations}
        stageGateHighlight={detailItem && stageGateHighlight ? stageGateHighlight : null}
      />
    </div>
  );
}

export default function DeliveryBoardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DeliveryBoardPageContent />
    </Suspense>
  );
}
