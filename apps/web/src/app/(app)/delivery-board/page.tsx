'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryBoardKindSegmented } from '@/features/projects/components/delivery-board/DeliveryBoardKindSegmented';
import { DeliveryBoardView } from '@/features/projects/components/delivery-board/DeliveryBoardView';
import { DeliveryBoardClosedBoard } from '@/features/projects/components/delivery-board/DeliveryBoardClosedBoard';
import {
  applyDeliveryBoardClosedFilters,
  buildClosedFilterOptions,
  type DeliveryBoardClosedFiltersInput,
} from '@/features/projects/components/delivery-board/delivery-board-closed-filters';
import { DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS } from '@/features/projects/components/delivery-board/delivery-board-active-filters';
import { DeliveryBoardClosedFiltersBar } from '@/features/projects/components/delivery-board/DeliveryBoardClosedFiltersBar';
import { DeliveryBoardClosedTable } from '@/features/projects/components/delivery-board/DeliveryBoardClosedTable';
import { DeliveryItemDetailSheet } from '@/features/projects/components/delivery-board/DeliveryItemDetailSheet';
import { mergeDeliveryBoardItems } from '@/features/projects/components/delivery-board/delivery-board-item-adapters';
import {
  fetchAllExtensionsList,
  fetchAllProductsList,
} from '@/features/projects/components/delivery-board/delivery-board-list-fetch';
import {
  countDeliveryAggregates,
  getItemId,
  getItemLifecycle,
  getProjectId,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
} from '@/features/projects/components/delivery-board/project-delivery-board-model';
import type { ProductBoardTab } from '@/features/projects/components/delivery-board/ProjectDeliveryBoardContextLinks';
import { useDeliveryBoardMutations } from '@/features/projects/components/delivery-board/use-delivery-board-mutations';

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

export default function DeliveryBoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilterId = searchParams.get('projectId');

  const [items, setItems] = useState<DeliveryBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<DeliveryBoardItem | null>(null);
  const [pipelineTab, setPipelineTab] = useState<'active' | 'closed'>('active');
  const [kindFilter, setKindFilter] = useState<DeliveryBoardKindFilter>('ALL');
  const [closedViewMode, setClosedViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [closedFilters, setClosedFilters] =
    useState<DeliveryBoardClosedFiltersInput>(DEFAULT_CLOSED_FILTERS);
  const [activePipelineFilters, setActivePipelineFilters] = useState(() => ({
    ...DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS,
  }));

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

  const deliveryMutations = useDeliveryBoardMutations(load);

  useEffect(() => {
    void load();
  }, [load]);

  const scopedItems = useMemo(() => {
    if (!projectFilterId) return items;
    return items.filter((item) => getProjectId(item) === projectFilterId);
  }, [items, projectFilterId]);

  const summaryCounts = useMemo(() => countDeliveryAggregates(scopedItems), [scopedItems]);

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

  const hasActiveClosedFilters = useMemo(() => {
    return (
      closedFilters.search !== '' ||
      closedFilters.projectId !== '' ||
      closedFilters.companyId !== '' ||
      closedFilters.ownerId !== '' ||
      closedFilters.productLineKey !== '' ||
      closedFilters.closedFrom !== '' ||
      closedFilters.closedTo !== '' ||
      closedFilters.deadlineResult !== 'ALL' ||
      closedFilters.result !== 'ALL'
    );
  }, [closedFilters]);

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
      if (pid) router.push(`/projects/${pid}/products/${productId}?tab=${tab}`);
    },
    [router, scopedItems, projectFilterId],
  );

  useEffect(() => {
    setDetailItem((cur) => {
      if (!cur) return null;
      const id = getItemId(cur);
      const next = scopedItems.find((i) => getItemId(i) === id);
      return next ?? cur;
    });
  }, [scopedItems]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {loadError && (
        <p className="text-destructive text-sm" role="alert">
          {loadError}
        </p>
      )}
      {loading ? (
        <>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Delivery Board</h1>
          <p className="text-muted-foreground text-sm">Loading board…</p>
        </>
      ) : (
        <Tabs
          value={pipelineTab}
          onValueChange={(value) => setPipelineTab(value as 'active' | 'closed')}
          className="flex min-h-0 w-full flex-1 basis-0 flex-col"
        >
          <header>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                <h1 className="text-foreground shrink-0 text-2xl font-semibold tracking-tight">
                  Delivery Board
                </h1>
                <TabsList variant="segmented" className="w-full min-w-0 sm:w-auto">
                  <TabsTrigger value="active" className="px-3 py-2.5 text-sm font-medium">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="px-3 py-2.5 text-sm font-medium">
                    Closed
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5 lg:w-auto lg:shrink-0">
                {projectFilterId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => router.push('/delivery-board')}
                  >
                    Clear project filter
                  </Button>
                ) : null}
                {pipelineTab === 'closed' ? (
                  <Tabs
                    value={closedViewMode}
                    onValueChange={(value) => setClosedViewMode(value as 'LIST' | 'BOARD')}
                  >
                    <TabsList variant="segmented" className="shrink-0">
                      <TabsTrigger value="LIST" aria-label="Table view" className="h-8 px-3 py-0">
                        <LayoutList size={14} aria-hidden />
                      </TabsTrigger>
                      <TabsTrigger value="BOARD" aria-label="Board view" className="h-8 px-3 py-0">
                        <LayoutGrid size={14} aria-hidden />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                ) : null}
                <DeliveryBoardKindSegmented value={kindFilter} onValueChange={setKindFilter} />
              </div>
            </div>
          </header>
          <TabsContent
            value="active"
            className="mt-4 flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden"
          >
            <DeliveryBoardView
              items={scopedItems}
              mutations={deliveryMutations}
              onOpenProduct={openProduct}
              onOpenProductTab={openProductTab}
              lockedStatusFilter="ACTIVE"
              summaryCounts={summaryCounts}
              onOpenDetails={setDetailItem}
              showBoardHeader={false}
              kindFilter={kindFilter}
              onKindFilterChange={setKindFilter}
              activePipelineFilters={activePipelineFilters}
              onActivePipelineFiltersChange={setActivePipelineFilters}
              onClearActivePipelineFilters={() =>
                setActivePipelineFilters({ ...DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS })
              }
            />
          </TabsContent>
          <TabsContent value="closed" className="mt-4 space-y-4">
            <DeliveryBoardClosedFiltersBar
              value={closedFilters}
              onChange={setClosedFilters}
              options={closedFilterOptions}
              onClear={() => setClosedFilters({ ...DEFAULT_CLOSED_FILTERS })}
              hasActiveFilters={hasActiveClosedFilters}
            />
            {closedViewMode === 'LIST' ? (
              <DeliveryBoardClosedTable items={closedFilteredItems} onOpenDetails={setDetailItem} />
            ) : (
              <DeliveryBoardClosedBoard
                items={closedFilteredItems}
                busyItemId={null}
                displayMode="closedCompact"
                onOpenProduct={openProduct}
                onOpenProductTab={openProductTab}
                onBoardAction={async () => {}}
                onCancel={() => {}}
                onOpenDetails={setDetailItem}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      <DeliveryItemDetailSheet
        item={detailItem}
        open={detailItem !== null}
        onOpenChange={(open) => {
          if (!open) setDetailItem(null);
        }}
        onEntityUpdated={load}
        boardMutations={deliveryMutations}
      />
    </div>
  );
}
