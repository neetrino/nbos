'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, ShoppingCart, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
} from '@/components/shared';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { orderLifecycleAction } from '@/features/finance/utils/order-lifecycle';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { ordersApi, type Order } from '@/lib/api/finance';
import { OrderGeneralTab } from './OrderGeneralTab';
import { OrderInvoicesTab } from './OrderInvoicesTab';
import { OrderLifecycleConfirmDialog } from './OrderLifecycleConfirmDialog';
import { OrderReconciliationTab } from './OrderReconciliationTab';
import { ORDER_DETAIL_SHEET_TABS, type OrderDetailSheetTab } from './order-detail-sheet-tabs';

interface OrderDetailSheetProps {
  orderId: string | null;
  initialOrder?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateInvoice: (order: Order) => void;
  refreshSignal?: number;
}

export function OrderDetailSheet({
  orderId,
  initialOrder = null,
  open,
  onOpenChange,
  onCreateInvoice,
  refreshSignal = 0,
}: OrderDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<OrderDetailSheetTab>('general');
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const tabScope = `${orderId ?? ''}:${open}`;
  const [trackedTabScope, setTrackedTabScope] = useState(tabScope);

  if (trackedTabScope !== tabScope) {
    setTrackedTabScope(tabScope);
    setActiveTab('general');
  }

  const {
    entity: order,
    loading,
    error,
    refresh,
  } = useEntityDetailHydration({
    entityId: orderId ?? '',
    open: open && Boolean(orderId),
    initialEntity: initialOrder,
    fetchById: ordersApi.getById,
    loadErrorMessage: 'Order could not be loaded.',
  });

  useEffect(() => {
    if (!open || !orderId || refreshSignal === 0) return;
    void refresh();
  }, [open, orderId, refresh, refreshSignal]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setLifecycleOpen(false);
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const fetchOrder = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleCreateInvoice = useCallback(() => {
    if (!order) return;
    onCreateInvoice(order);
  }, [onCreateInvoice, order]);

  const handleOrderUpdated = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleOrderDeleted = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  if (!orderId) return null;

  const sourcePageHref = ordersListWithOpenOrderHref(orderId);
  const lifecycleMode = order ? orderLifecycleAction(order) : null;

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchOrder()}>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="medium"
          sourcePageHref={sourcePageHref}
        >
          <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
            {loading && !order ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : order ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 items-center gap-2">
                    <ShoppingCart className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {getOrderDisplayTitle(order)}
                    </h2>
                  </div>
                </div>
                {lifecycleMode ? (
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem variant="destructive" onClick={() => setLifecycleOpen(true)}>
                      {lifecycleMode === 'delete' ? <Trash2 /> : <Archive />}
                      {lifecycleMode === 'delete' ? 'Delete order' : 'Close order'}
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                ) : null}
              </div>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={ORDER_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as OrderDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              {loading && !order ? (
                <LoadingState count={3} />
              ) : error && !order ? (
                <ErrorState description={error} onRetry={() => void fetchOrder()} />
              ) : order ? (
                <OrderDetailSheetBody
                  activeTab={activeTab}
                  order={order}
                  onCreateInvoice={handleCreateInvoice}
                />
              ) : null}
            </div>
          </ScrollArea>
        </EntityDetailSheetContent>
      </Sheet>

      {order && lifecycleMode ? (
        <OrderLifecycleConfirmDialog
          order={order}
          open={lifecycleOpen}
          onOpenChange={setLifecycleOpen}
          onOrderUpdated={handleOrderUpdated}
          onOrderDeleted={handleOrderDeleted}
        />
      ) : null}
    </EntityItemHost>
  );
}

function OrderDetailSheetBody({
  activeTab,
  order,
  onCreateInvoice,
}: {
  activeTab: OrderDetailSheetTab;
  order: Order;
  onCreateInvoice: () => void;
}) {
  if (activeTab === 'invoices') {
    return <OrderInvoicesTab order={order} onCreateInvoice={onCreateInvoice} />;
  }
  if (activeTab === 'reconciliation') {
    return <OrderReconciliationTab order={order} />;
  }
  return <OrderGeneralTab order={order} />;
}
