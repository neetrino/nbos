'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { extensionsApi, type FullExtension } from '@/lib/api/extensions';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { getItemLabel, type DeliveryBoardItem } from './project-delivery-board-model';
import { mergeDeliveryDetailLifecycle } from './delivery-item-detail-merge-lifecycle';
import {
  DELIVERY_DETAIL_PRODUCT_NEXT,
  type DeliveryDetailPanel,
  type DeliveryDetailSecondaryId,
} from './delivery-item-detail.constants';
import { DeliveryItemDetailHeader } from './DeliveryItemDetailHeader';
import { DeliveryItemDetailRequirementsZone } from './DeliveryItemDetailRequirementsZone';
import { DeliveryItemDetailTabBar } from './DeliveryItemDetailTabBar';
import { DeliveryItemDetailCockpit } from './DeliveryItemDetailCockpit';
import { DeliveryItemDetailSecondaryPanels } from './DeliveryItemDetailSecondaryPanels';

interface DeliveryItemDetailSheetProps {
  item: DeliveryBoardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated: () => void;
}

export function DeliveryItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEntityUpdated,
}: DeliveryItemDetailSheetProps) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [extension, setExtension] = useState<FullExtension | null>(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<DeliveryDetailPanel>('cockpit');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open && item) setPanel('cockpit');
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
  const terminal = Boolean(lifecycle?.isTerminal);

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

  const productNext =
    item?.kind === 'PRODUCT' && product ? (DELIVERY_DETAIL_PRODUCT_NEXT[product.status] ?? []) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1400px]"
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
            <DeliveryItemDetailRequirementsZone
              lifecycle={lifecycle}
              product={product}
              extension={extension}
              productNextStatuses={productNext}
            />
            <DeliveryItemDetailTabBar
              panel={panel}
              onSelectSecondary={(id: DeliveryDetailSecondaryId) => setPanel(id)}
            />
            <ScrollArea className="min-h-0 flex-1">
              {loading ? (
                <div className="space-y-4 px-7 py-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : panel === 'cockpit' && (product || extension) ? (
                <DeliveryItemDetailCockpit
                  lifecycle={lifecycle}
                  product={product}
                  extension={extension}
                  terminal={terminal}
                  resolution={lifecycle?.resolution}
                  cancellationReason={lifecycle?.cancellationReason ?? null}
                  clientAcceptedAt={product?.clientAcceptedAt ?? null}
                  clientAcceptanceNote={product?.clientAcceptanceNote ?? null}
                />
              ) : panel !== 'cockpit' && headerProps ? (
                <DeliveryItemDetailSecondaryPanels
                  view={panel}
                  projectId={
                    (item.kind === 'PRODUCT' ? item.product.projectId : item.extension.projectId) ??
                    ''
                  }
                  productId={headerProps.productId}
                  onBack={() => setPanel('cockpit')}
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
