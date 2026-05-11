'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { extensionsApi, type FullExtension } from '@/lib/api/extensions';
import { productsApi, type FullProduct } from '@/lib/api/products';
import {
  getItemLabel,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import { DeliveryStageActionBar } from './DeliveryStageActionBar';
import type { UseDeliveryBoardMutationsResult } from './use-delivery-board-mutations';
import { mergeDeliveryDetailLifecycle } from './delivery-item-detail-merge-lifecycle';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';
import { DeliveryItemDetailHeader } from './DeliveryItemDetailHeader';
import { DeliveryItemDetailTabBar } from './DeliveryItemDetailTabBar';
import { DeliveryItemDetailSecondaryPanels } from './DeliveryItemDetailSecondaryPanels';
import { DeliveryItemDetailGeneralTab } from './DeliveryItemDetailGeneralTab';
import { DeliveryLifecycleStrip } from './DeliveryLifecycleStrip';

interface DeliveryItemDetailSheetProps {
  item: DeliveryBoardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated: () => void;
  /** When set (global Delivery Board), stage actions match board + server RBAC. */
  boardMutations?: UseDeliveryBoardMutationsResult;
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

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    onEntityUpdated();
  };

  const title = item ? getItemLabel(item) : '';
  const lifecycle = item ? mergeDeliveryDetailLifecycle(item, product, extension) : undefined;
  const stageLifecycle = lifecycle ?? (item ? getItemLifecycle(item) : undefined);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1200px]"
      >
        {!item ? null : (
          <>
            <DeliveryItemDetailHeader
              title={title}
              entityKind={headerProps?.entityKind ?? 'PRODUCT'}
              projectCode={headerProps?.projectCode ?? '—'}
              projectName={headerProps?.projectName ?? '—'}
              projectHref={headerProps?.projectHref ?? '#'}
              lifecycle={lifecycle}
              deadline={headerProps?.deadline ?? null}
              workSpaceHref={headerProps?.workSpaceHref ?? '#'}
              sourcePageHref={headerProps?.sourcePageHref ?? '#'}
              loading={loading}
              onRefresh={handleRefresh}
            />
            {boardMutations && item && !loading ? (
              <DeliveryStageActionBar
                variant="drawer"
                item={item}
                lifecycle={stageLifecycle}
                busyItemId={boardMutations.busyItemId}
                onMoveNext={() => void boardMutations.handleBoardAction(item, 'MOVE_NEXT')}
                onResume={() => void boardMutations.handleBoardAction(item, 'RESUME')}
                onComplete={() => void boardMutations.handleBoardAction(item, 'COMPLETE')}
                onCancel={() => boardMutations.requestCancel(item)}
              />
            ) : null}
            <div className="border-border shrink-0 border-b px-5 py-2 sm:px-7 dark:border-stone-800">
              <DeliveryLifecycleStrip lifecycle={lifecycle} />
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
                  workSpaceHref={headerProps.workSpaceHref}
                  sourcePageHref={headerProps.sourcePageHref}
                  credentialsTabHref={credentialsTabHref}
                  projectHubHref={projectHubHref}
                  financeTabHref={financeTabHref}
                  onRefreshDetail={handleRefresh}
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
