import { Plus, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import type { OrderReconciliationGap } from '@/features/finance/constants/order-reconciliation-drilldown';
import type { Order } from '@/lib/api/finance';
import type { OrderViewMode } from './order-page-types';
import { OrdersBoardView } from './OrdersBoardView';
import { OrdersTable } from './OrdersTable';
import { PartnerOrdersDrilldownBanner } from './PartnerOrdersDrilldownBanner';
import { ReconciliationGapBanner } from './orders-page-helpers';

interface OrdersPageContentProps {
  orders: Order[];
  view: OrderViewMode;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  onDismissMutationError: () => void;
  onRetry: () => void;
  gap: OrderReconciliationGap | null;
  partnerIdFromUrl: string | null;
  onClearReconciliationGap: () => void;
  onClearPartnerDrilldown: () => void;
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}

export function OrdersPageContent({
  orders,
  view,
  loading,
  error,
  mutationError,
  onDismissMutationError,
  onRetry,
  gap,
  partnerIdFromUrl,
  onClearReconciliationGap,
  onClearPartnerDrilldown,
  onOrderClick,
  onCreateInvoice,
}: OrdersPageContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {gap ? <ReconciliationGapBanner gap={gap} onClear={onClearReconciliationGap} /> : null}
      {partnerIdFromUrl ? <PartnerOrdersDrilldownBanner onClear={onClearPartnerDrilldown} /> : null}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={onRetry} />
      ) : (
        <>
          {mutationError ? (
            <ListMutationErrorBanner message={mutationError} onDismiss={onDismissMutationError} />
          ) : null}
          {orders.length === 0 ? (
            <OrdersEmptyState
              partnerIdFromUrl={partnerIdFromUrl}
              gap={gap}
              onClearPartnerDrilldown={onClearPartnerDrilldown}
              onClearReconciliationGap={onClearReconciliationGap}
            />
          ) : (
            <OrdersListOrBoard
              view={view}
              orders={orders}
              onOrderClick={onOrderClick}
              onCreateInvoice={onCreateInvoice}
            />
          )}
        </>
      )}
    </div>
  );
}

function OrdersListOrBoard({
  view,
  orders,
  onOrderClick,
  onCreateInvoice,
}: {
  view: OrderViewMode;
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onCreateInvoice: (order: Order) => void;
}) {
  if (view === 'board') {
    return (
      <OrdersBoardView
        orders={orders}
        onOrderClick={onOrderClick}
        onCreateInvoice={onCreateInvoice}
      />
    );
  }

  return (
    <OrdersTable orders={orders} onOrderClick={onOrderClick} onCreateInvoice={onCreateInvoice} />
  );
}

function OrdersEmptyState({
  partnerIdFromUrl,
  gap,
  onClearPartnerDrilldown,
  onClearReconciliationGap,
}: {
  partnerIdFromUrl: string | null;
  gap: OrderReconciliationGap | null;
  onClearPartnerDrilldown: () => void;
  onClearReconciliationGap: () => void;
}) {
  if (partnerIdFromUrl) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders for this partner"
        description="There are no finance orders linked to this partner in the selected period."
        action={
          <Button variant="outline" onClick={onClearPartnerDrilldown}>
            <X size={16} />
            Clear partner filter
          </Button>
        }
      />
    );
  }

  if (gap) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders match this reconciliation filter"
        description="Try clearing the filter or widening the reporting period."
        action={
          <Button variant="outline" onClick={onClearReconciliationGap}>
            <X size={16} />
            Clear reconciliation filter
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={ShoppingCart}
      title="No orders yet"
      description="Orders are created from closed deals"
      action={
        <Button disabled>
          <Plus size={16} />
          Create Order
        </Button>
      }
    />
  );
}
