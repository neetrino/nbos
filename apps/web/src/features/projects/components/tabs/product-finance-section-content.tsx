'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { OrdersBoardView } from '@/features/finance/components/orders/OrdersBoardView';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import { resolveProductFinanceBoardScope } from '@/features/projects/utils/resolve-product-finance-scope';
import type { ExpensesViewMode } from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { ProductFinanceClientServicesPanel } from '@/features/projects/components/tabs/product-finance-client-services-panel';
import { ProductFinanceExpensesPanel } from '@/features/projects/components/tabs/product-finance-expenses-panel';
import { ProductFinanceInvoicesPanel } from '@/features/projects/components/tabs/product-finance-invoices-panel';
import { ProductFinanceSubscriptionsPanel } from '@/features/projects/components/tabs/product-finance-subscriptions-panel';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import type { InvoiceViewMode } from '@/features/finance/components/invoices/invoice-page-types';
import { filterProductFinanceOrders } from '@/features/projects/utils/filter-product-finance-data';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';
import type { Order } from '@/lib/api/finance';
import type { ProjectSubscription } from '@/lib/api/projects';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import { cn } from '@/lib/utils';

interface ProductFinanceSectionContentProps {
  section: ProductFinanceSection;
  search: string;
  debouncedSearch: string;
  filters: Record<string, string>;
  ordersView: OrderViewMode;
  invoicesView: InvoiceViewMode;
  expensesView: ExpensesViewMode;
  clientServicesView: ClientServicesViewMode;
  financeOrders: Order[];
  subscriptions: ProjectSubscription[];
  projectId: string;
  productId: string;
  productName: string;
  companyId?: string | null;
  canCreateSubscription: boolean;
  createSubscriptionOpen: boolean;
  onCreateSubscriptionOpenChange: (open: boolean) => void;
  onSubscriptionsRefresh: () => void;
}

export function ProductFinanceSectionContent({
  section,
  search,
  debouncedSearch,
  filters,
  ordersView,
  invoicesView,
  expensesView,
  clientServicesView,
  financeOrders,
  subscriptions,
  projectId,
  productId,
  productName,
  companyId,
  canCreateSubscription,
  createSubscriptionOpen,
  onCreateSubscriptionOpenChange,
  onSubscriptionsRefresh,
}: ProductFinanceSectionContentProps) {
  const orderSheet = useProductEntityDetailSheet();

  const handleOpenOrder = useCallback(
    (order: Order) => {
      orderSheet.openEntity(order);
    },
    [orderSheet],
  );

  const initialOrder = useMemo(
    () => financeOrders.find((order) => order.id === orderSheet.entityId) ?? null,
    [financeOrders, orderSheet.entityId],
  );

  if (section === 'orders') {
    const displayOrders = filterProductFinanceOrders(financeOrders, search, filters);
    const boardScope = resolveProductFinanceBoardScope(filters.boardScope);

    if (displayOrders.length === 0) {
      return (
        <FinanceSectionEmpty
          icon={ShoppingCart}
          title="No orders"
          description="No orders match your filters for this product."
          href="/finance/orders"
          linkLabel="Open Orders in Finance"
        />
      );
    }

    return (
      <>
        {ordersView === 'list' ? (
          <OrdersTable
            orders={displayOrders}
            boardScope={boardScope}
            onOrderClick={handleOpenOrder}
            onCreateInvoice={() => undefined}
          />
        ) : (
          <OrdersBoardView
            orders={displayOrders}
            boardScope={boardScope}
            onOrderClick={handleOpenOrder}
          />
        )}
        <OrderDetailSheet
          orderId={orderSheet.entityId}
          initialOrder={initialOrder}
          open={orderSheet.isOpen}
          onOpenChange={orderSheet.handleOpenChange}
          onCreateInvoice={() => undefined}
          canQuickCreateInvoice={false}
        />
      </>
    );
  }

  if (section === 'invoices') {
    return (
      <ProductFinanceInvoicesPanel
        productId={productId}
        companyId={companyId}
        search={search}
        filters={filters}
        view={invoicesView}
      />
    );
  }

  if (section === 'subscriptions') {
    return (
      <ProductFinanceSubscriptionsPanel
        productId={productId}
        productName={productName}
        projectId={projectId}
        subscriptions={subscriptions}
        search={search}
        filters={filters}
        canCreate={canCreateSubscription}
        createOpen={createSubscriptionOpen}
        onCreateOpenChange={onCreateSubscriptionOpenChange}
        onSubscriptionsRefresh={onSubscriptionsRefresh}
      />
    );
  }

  if (section === 'expenses') {
    return (
      <ProductFinanceExpensesPanel
        projectId={projectId}
        productId={productId}
        search={debouncedSearch}
        filters={filters}
        view={expensesView}
      />
    );
  }

  return (
    <ProductFinanceClientServicesPanel
      productId={productId}
      search={debouncedSearch}
      filters={filters}
      view={clientServicesView}
    />
  );
}

function FinanceSectionEmpty({
  icon: Icon,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        <Link
          href={href}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
        >
          {linkLabel}
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      }
    />
  );
}
