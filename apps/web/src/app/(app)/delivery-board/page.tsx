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
  const [closedViewMode, setClosedViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [closedFilters, setClosedFilters] =
    useState<DeliveryBoardClosedFiltersInput>(DEFAULT_CLOSED_FILTERS);
  const [closedKindFilter, setClosedKindFilter] = useState<DeliveryBoardKindFilter>('ALL');

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
    if (closedKindFilter === 'PRODUCT') {
      closed = closed.filter((item) => item.kind === 'PRODUCT');
    } else if (closedKindFilter === 'EXTENSION') {
      closed = closed.filter((item) => item.kind === 'EXTENSION');
    }
    return closed;
  }, [scopedItems, closedKindFilter]);

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
    <div className="flex h-full flex-col gap-4 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery Board</h1>
        <p className="text-muted-foreground text-sm">
          Company-wide Product and Extension lifecycle.{' '}
          {projectFilterId ? (
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => router.push('/delivery-board')}
            >
              Clear project filter
            </Button>
          ) : null}
        </p>
      </div>

      {loadError && (
        <p className="text-destructive text-sm" role="alert">
          {loadError}
        </p>
      )}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading board…</p>
      ) : (
        <Tabs defaultValue="active" className="flex min-h-0 w-full flex-1 flex-col">
          <div className="mb-2 flex shrink-0 justify-end">
            <TabsList variant="segmented">
              <TabsTrigger value="active" className="px-4 py-2 text-sm">
                Active
              </TabsTrigger>
              <TabsTrigger value="closed" className="px-4 py-2 text-sm">
                Closed
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="active" className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col">
            <DeliveryBoardView
              items={scopedItems}
              mutations={deliveryMutations}
              onOpenProduct={openProduct}
              onOpenProductTab={openProductTab}
              lockedStatusFilter="ACTIVE"
              summaryCounts={summaryCounts}
              onOpenDetails={setDetailItem}
            />
          </TabsContent>
          <TabsContent value="closed" className="mt-0 space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DeliveryBoardKindSegmented
                value={closedKindFilter}
                onValueChange={setClosedKindFilter}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={closedViewMode === 'LIST' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setClosedViewMode('LIST')}
                >
                  <LayoutList size={14} />
                  Table
                </Button>
                <Button
                  type="button"
                  variant={closedViewMode === 'BOARD' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setClosedViewMode('BOARD')}
                >
                  <LayoutGrid size={14} />
                  Board
                </Button>
              </div>
            </div>
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
