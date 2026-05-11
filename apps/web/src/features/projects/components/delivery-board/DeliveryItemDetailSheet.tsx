'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { extensionsApi, type FullExtension } from '@/lib/api/extensions';
import { productsApi, type FullProduct } from '@/lib/api/products';
import type { DeliveryActiveStage } from './project-delivery-board-actions';
import {
  DeliveryPipelineStages,
  DELIVERY_PIPELINE_CANCEL_KEY,
  DELIVERY_PIPELINE_DONE_KEY,
  type DeliveryPipelineClickKey,
} from './DeliveryPipelineStages';
import {
  getItemId,
  getItemLabel,
  getItemLifecycle,
  ACTIVE_DELIVERY_STAGES,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import type { UseDeliveryBoardMutationsResult } from './use-delivery-board-mutations';
import { mergeDeliveryDetailLifecycle } from './delivery-item-detail-merge-lifecycle';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';
import { DeliveryItemDetailHeader } from './DeliveryItemDetailHeader';
import { DeliveryItemDetailTabBar } from './DeliveryItemDetailTabBar';
import { DeliveryItemDetailSecondaryPanels } from './DeliveryItemDetailSecondaryPanels';
import { DeliveryItemDetailGeneralTab } from './DeliveryItemDetailGeneralTab';

interface DeliveryItemDetailSheetProps {
  item: DeliveryBoardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated: () => void;
  /** When set (global Delivery Board), stage actions match board + server RBAC. */
  boardMutations?: UseDeliveryBoardMutationsResult;
}

function isActivePipelineStage(key: DeliveryPipelineClickKey): key is DeliveryActiveStage {
  return (ACTIVE_DELIVERY_STAGES as readonly string[]).includes(key);
}

export function DeliveryItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEntityUpdated,
  boardMutations,
}: DeliveryItemDetailSheetProps) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [extension, setExtension] = useState<FullExtension | null>(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<DeliveryDetailTabId>('general');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open && item) setPanel('general');
  }, [open, item]);

  useEffect(() => {
    if (!open || !item) {
      setProduct(null);
      setExtension(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      try {
        if (item.kind === 'PRODUCT') {
          const data = await productsApi.getById(item.product.id);
          if (!cancelled) setProduct(data);
        } else {
          const data = await extensionsApi.getById(item.extension.id);
          if (!cancelled) setExtension(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, item, refreshKey]);

  const refreshDetailOnly = () => {
    setRefreshKey((k) => k + 1);
  };

  const lifecycle = item ? mergeDeliveryDetailLifecycle(item, product, extension) : undefined;
  const displayTitle = product?.name ?? extension?.name ?? (item ? getItemLabel(item) : '');

  const headerProps =
    item && item.kind === 'PRODUCT'
      ? {
          entityKind: 'PRODUCT' as const,
          projectCode: item.product.project?.code ?? '—',
          projectName: item.product.project?.name ?? '—',
          projectHref: `/projects/${item.product.projectId}`,
          deadline: item.product.deadline,
          workSpaceHref: `/projects/${item.product.projectId}/products/${item.product.id}?tab=tasks`,
          sourcePageHref: `/projects/${item.product.projectId}/products/${item.product.id}`,
          productId: item.product.id,
        }
      : item && item.kind === 'EXTENSION'
        ? {
            entityKind: 'EXTENSION' as const,
            projectCode: item.extension.project?.code ?? '—',
            projectName: item.extension.project?.name ?? '—',
            projectHref: `/projects/${item.extension.projectId}`,
            deadline: null as string | null,
            workSpaceHref: `/projects/${item.extension.projectId}/products/${item.extension.productId}?tab=tasks`,
            sourcePageHref: `/projects/${item.extension.projectId}/products/${item.extension.productId}?tab=extensions`,
            productId: item.extension.productId,
          }
        : null;

  const panelProjectId =
    item?.kind === 'PRODUCT'
      ? item.product.projectId
      : item?.kind === 'EXTENSION'
        ? item.extension.projectId
        : '';
  const financeTabHref =
    headerProps && panelProjectId
      ? `/projects/${panelProjectId}/products/${headerProps.productId}?tab=finance`
      : '#';
  const projectHubHref = panelProjectId ? `/projects/${panelProjectId}` : '#';
  const credentialsTabHref =
    headerProps && panelProjectId
      ? `/projects/${panelProjectId}/products/${headerProps.productId}?tab=credentials`
      : '#';

  const handleCommitTitle = useCallback(
    async (trimmed: string) => {
      if (!item) return;
      if (item.kind === 'PRODUCT') {
        await productsApi.update(item.product.id, { name: trimmed });
      } else {
        await extensionsApi.update(item.extension.id, { name: trimmed });
      }
      refreshDetailOnly();
      onEntityUpdated();
    },
    [item, onEntityUpdated],
  );

  const handlePipelineSelect = useCallback(
    (key: DeliveryPipelineClickKey) => {
      if (!item || !boardMutations) return;
      if (key === DELIVERY_PIPELINE_DONE_KEY) {
        void boardMutations.handleBoardAction(item, 'COMPLETE');
        return;
      }
      if (key === DELIVERY_PIPELINE_CANCEL_KEY) {
        boardMutations.requestCancel(item);
        return;
      }
      if (isActivePipelineStage(key)) {
        void boardMutations.advanceToDeliveryStage(item, key);
      }
    },
    [item, boardMutations],
  );

  const busy = Boolean(item && boardMutations?.busyItemId === getItemId(item));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[90vw] sm:max-w-none"
      >
        {!item ? null : (
          <>
            <DeliveryItemDetailHeader
              title={displayTitle}
              entityKind={headerProps?.entityKind ?? 'PRODUCT'}
              projectCode={headerProps?.projectCode ?? '—'}
              projectName={headerProps?.projectName ?? '—'}
              projectHref={headerProps?.projectHref ?? '#'}
              deadline={headerProps?.deadline ?? null}
              loading={loading}
              onCommitTitle={handleCommitTitle}
            />

            {lifecycle?.workStatus === 'ON_HOLD' && boardMutations ? (
              <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b bg-amber-50/60 px-7 py-2.5 dark:bg-amber-950/20">
                <p className="text-muted-foreground text-sm">Delivery is paused.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void boardMutations.handleBoardAction(item, 'RESUME')}
                >
                  Resume
                </Button>
              </div>
            ) : null}

            <div className="border-border shrink-0 border-b border-stone-100 dark:border-stone-800">
              <DeliveryPipelineStages
                lifecycle={lifecycle}
                disabled={busy || !boardMutations}
                onSelect={handlePipelineSelect}
              />
            </div>

            <DeliveryItemDetailTabBar panel={panel} onSelect={setPanel} />

            <ScrollArea className="min-h-0 flex-1">
              {loading ? (
                <div className="space-y-4 px-7 py-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : panel === 'general' && item && headerProps ? (
                <DeliveryItemDetailGeneralTab
                  item={item}
                  product={product}
                  extension={extension}
                  lifecycle={lifecycle}
                  sourcePageHref={headerProps.sourcePageHref}
                  credentialsTabHref={credentialsTabHref}
                  projectHubHref={projectHubHref}
                  financeTabHref={financeTabHref}
                  onRefreshDetail={refreshDetailOnly}
                />
              ) : panel !== 'general' && !loading && headerProps && item ? (
                <DeliveryItemDetailSecondaryPanels
                  view={panel}
                  projectId={
                    (item.kind === 'PRODUCT' ? item.product.projectId : item.extension.projectId) ??
                    ''
                  }
                  productId={headerProps.productId}
                  auditEntityType={item.kind === 'PRODUCT' ? 'PRODUCT' : 'EXTENSION'}
                  auditEntityId={item.kind === 'PRODUCT' ? item.product.id : item.extension.id}
                  financeTabHref={financeTabHref}
                  projectHubHref={projectHubHref}
                  workSpaceHref={headerProps.workSpaceHref}
                  bonusOrderId={product?.order?.id ?? extension?.order?.id ?? null}
                  openDealHref={
                    product?.order?.deal?.id != null
                      ? `/crm/deals?openDealId=${encodeURIComponent(product.order.deal.id)}`
                      : extension?.order?.deal?.id != null
                        ? `/crm/deals?openDealId=${encodeURIComponent(extension.order.deal.id)}`
                        : null
                  }
                  dealCode={product?.order?.deal?.code ?? extension?.order?.deal?.code ?? null}
                />
              ) : (
                <p className="text-muted-foreground px-7 py-6 text-sm">Could not load details.</p>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
