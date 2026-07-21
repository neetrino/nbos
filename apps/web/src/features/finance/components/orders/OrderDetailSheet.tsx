'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, ShoppingCart, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { orderLifecycleAction } from '@/features/finance/utils/order-lifecycle';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { ordersApi, type Order } from '@/lib/api/finance';
import { OrderGeneralTab } from './OrderGeneralTab';
import { OrderInvoicesTab } from './OrderInvoicesTab';
import { OrderLifecycleConfirmDialog } from './OrderLifecycleConfirmDialog';
import { OrderReconciliationTab } from './OrderReconciliationTab';
import { ORDER_DETAIL_SHEET_TABS, type OrderDetailSheetTab } from './order-detail-sheet-tabs';
import { ORDER_STATUSES } from './order-statuses';

/** Order detail: single-column general — narrower than shared auxiliary (36rem). */
const ORDER_DETAIL_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[30rem]';

const ORDER_DETAIL_SHEET_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[30rem]';

interface OrderDetailSheetProps {
  orderId: string | null;
  initialOrder?: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateInvoice: (order: Order) => void;
  refreshSignal?: number;
  forceNestedBackdrop?: boolean;
}

export function OrderDetailSheet({
  orderId,
  initialOrder = null,
  open,
  onOpenChange,
  onCreateInvoice,
  refreshSignal = 0,
  forceNestedBackdrop = false,
}: OrderDetailSheetProps) {
  const { persistedValue: sheetId, onOpenChangeComplete } = useSheetPersistedValue(orderId);
  const hostMounted = useSheetHostMounted(open, sheetId);

  const [activeTab, setActiveTab] = useState<OrderDetailSheetTab>('general');
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const tabScope = `${sheetId ?? ''}:${open}`;
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
    entityId: sheetId ?? '',
    open: open && Boolean(sheetId),
    initialEntity: initialOrder,
    fetchById: ordersApi.getById,
    loadErrorMessage: 'Order could not be loaded.',
  });

  useEffect(() => {
    if (!open || !sheetId || refreshSignal === 0) return;
    void refresh();
  }, [open, sheetId, refresh, refreshSignal]);

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

  if (!hostMounted) return null;

  const sourcePageHref = ordersListWithOpenOrderHref(sheetId ?? '');
  const lifecycleMode = order ? orderLifecycleAction(order) : null;
  const statusCfg = order ? ORDER_STATUSES[order.status] : undefined;

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchOrder()}>
      <Sheet
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          contentClassName={ORDER_DETAIL_SHEET_WIDTH_CLASS}
          railAnchorClassName={ORDER_DETAIL_SHEET_RAIL_ANCHOR_CLASS}
          sourcePageHref={sourcePageHref}
          forceNestedBackdrop={forceNestedBackdrop}
        >
          <div className="bg-background shrink-0 px-5 pt-5 pb-3">
            {loading && !order ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : order ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <ShoppingCart className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {getOrderDisplayTitle(order)}
                    </h2>
                    {statusCfg ? (
                      <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
                    ) : null}
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
                <DetailSheetTabPanel tabKey={activeTab}>
                  <OrderDetailSheetBody
                    activeTab={activeTab}
                    order={order}
                    onCreateInvoice={handleCreateInvoice}
                  />
                </DetailSheetTabPanel>
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
  if (activeTab === 'general') return <OrderGeneralTab order={order} />;
  if (activeTab === 'invoices') {
    return <OrderInvoicesTab order={order} onCreateInvoice={onCreateInvoice} />;
  }
  return <OrderReconciliationTab order={order} />;
}
