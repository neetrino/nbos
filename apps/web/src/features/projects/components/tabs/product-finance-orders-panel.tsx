'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { DataView, EmptyState, LoadingState, QueryLoadError } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { OrdersBoardView } from '@/features/finance/components/orders/OrdersBoardView';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';
import { PRODUCT_FINANCE_ORDER_PAGE_SIZE } from '@/features/projects/constants/product-finance.constants';
import { filterProductFinanceOrders } from '@/features/projects/utils/filter-product-finance-data';
import { resolveProductFinanceBoardScope } from '@/features/projects/utils/resolve-product-finance-scope';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import type { Order } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

interface ProductFinanceOrdersPanelProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  truncated: boolean;
  search: string;
  filters: Record<string, string>;
  view: OrderViewMode;
  onRetry: () => void;
}

export function ProductFinanceOrdersPanel({
  orders,
  loading,
  error,
  truncated,
  search,
  filters,
  view,
  onRetry,
}: ProductFinanceOrdersPanelProps) {
  const orderSheet = useProductEntityDetailSheet();
  const boardScope = resolveProductFinanceBoardScope(filters.boardScope);
  const displayOrders = useMemo(
    () => filterProductFinanceOrders(orders, search, filters),
    [orders, search, filters],
  );
  const initialOrder = useMemo(
    () => orders.find((order) => order.id === orderSheet.entityId) ?? null,
    [orders, orderSheet.entityId],
  );
  const handleOpenOrder = useCallback(
    (order: Order) => {
      orderSheet.openEntity(order);
    },
    [orderSheet],
  );

  const ordersSurface = (
    <ProductFinanceOrdersSurface
      truncated={truncated}
      displayOrders={displayOrders}
      boardScope={boardScope}
      view={view}
      orderId={orderSheet.entityId}
      initialOrder={initialOrder}
      sheetOpen={orderSheet.isOpen}
      onOpenOrder={handleOpenOrder}
      onSheetOpenChange={orderSheet.handleOpenChange}
    />
  );

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={orders.length > 0}
      loadingFallback={<LoadingState />}
      errorFallback={<QueryLoadError description={error ?? ''} onRetry={onRetry} />}
      emptyFallback={ordersSurface}
    >
      {ordersSurface}
    </DataView>
  );
}

function ProductFinanceOrdersSurface({
  truncated,
  displayOrders,
  boardScope,
  view,
  orderId,
  initialOrder,
  sheetOpen,
  onOpenOrder,
  onSheetOpenChange,
}: {
  truncated: boolean;
  displayOrders: Order[];
  boardScope: ReturnType<typeof resolveProductFinanceBoardScope>;
  view: OrderViewMode;
  orderId: string | null;
  initialOrder: Order | null;
  sheetOpen: boolean;
  onOpenOrder: (order: Order) => void;
  onSheetOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {truncated ? (
        <p className="text-muted-foreground mb-3 text-sm">
          Showing the first {PRODUCT_FINANCE_ORDER_PAGE_SIZE} orders.{' '}
          <Link
            href="/finance/orders"
            className={cn(buttonVariants({ variant: 'link' }), 'h-auto px-0')}
          >
            Open all orders in Finance
          </Link>
        </p>
      ) : null}
      {displayOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders"
          description="No orders match your filters for this product."
          action={
            <Link
              href="/finance/orders"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              Open Orders in Finance
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
          }
        />
      ) : view === 'list' ? (
        <OrdersTable
          orders={displayOrders}
          boardScope={boardScope}
          onOrderClick={onOpenOrder}
          onCreateInvoice={() => undefined}
        />
      ) : (
        <OrdersBoardView
          orders={displayOrders}
          boardScope={boardScope}
          onOrderClick={onOpenOrder}
        />
      )}
      <OrderDetailSheet
        orderId={orderId}
        initialOrder={initialOrder}
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
        onCreateInvoice={() => undefined}
        canQuickCreateInvoice={false}
      />
    </>
  );
}
