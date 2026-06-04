'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCw, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import { OrdersBoardView } from '@/features/finance/components/orders/OrdersBoardView';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import {
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type { ExpensesViewMode } from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { FinanceSubscriptionsSection } from '@/features/projects/components/tabs/finance-tab-sections';
import { ProductFinanceClientServicesPanel } from '@/features/projects/components/tabs/product-finance-client-services-panel';
import { ProductFinanceExpensesPanel } from '@/features/projects/components/tabs/product-finance-expenses-panel';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import {
  filterProductFinanceOrders,
  filterProductFinanceSubscriptions,
} from '@/features/projects/utils/filter-product-finance-data';
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
  expensesView: ExpensesViewMode;
  clientServicesView: ClientServicesViewMode;
  financeOrders: Order[];
  subscriptions: ProjectSubscription[];
  projectId: string;
}

export function ProductFinanceSectionContent({
  section,
  search,
  debouncedSearch,
  filters,
  ordersView,
  expensesView,
  clientServicesView,
  financeOrders,
  subscriptions,
  projectId,
}: ProductFinanceSectionContentProps) {
  const orderSheet = useProductEntityDetailSheet();
  const subscriptionSheet = useProductEntityDetailSheet();

  const handleOpenOrder = useCallback(
    (order: Order) => {
      orderSheet.openEntity(order.id);
    },
    [orderSheet],
  );

  const handleOpenSubscription = useCallback(
    (subscription: ProjectSubscription) => {
      subscriptionSheet.openEntity(subscription.id);
    },
    [subscriptionSheet],
  );

  if (section === 'orders') {
    const displayOrders = filterProductFinanceOrders(financeOrders, search, filters);
    const boardScope = resolveBoardLifecycleScope(filters.boardScope) as BoardLifecycleScope;

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
            onCreateInvoice={() => undefined}
          />
        )}
        <OrderDetailSheet
          orderId={orderSheet.entityId}
          open={orderSheet.isOpen}
          onOpenChange={orderSheet.handleOpenChange}
          onCreateInvoice={() => undefined}
        />
      </>
    );
  }

  if (section === 'subscriptions') {
    const rows = filterProductFinanceSubscriptions(subscriptions, search, filters);
    if (rows.length === 0) {
      return (
        <FinanceSectionEmpty
          icon={RefreshCw}
          title="No subscriptions"
          description="No subscriptions match your filters for this project."
          href="/finance/subscriptions"
          linkLabel="Open Subscriptions in Finance"
        />
      );
    }
    return (
      <>
        <FinanceSubscriptionsSection
          subscriptions={rows}
          onOpenSubscription={handleOpenSubscription}
        />
        <SubscriptionDetailSheet
          subscriptionId={subscriptionSheet.entityId}
          open={subscriptionSheet.isOpen}
          onOpenChange={subscriptionSheet.handleOpenChange}
        />
      </>
    );
  }

  if (section === 'expenses') {
    return (
      <ProductFinanceExpensesPanel
        projectId={projectId}
        search={debouncedSearch}
        filters={filters}
        view={expensesView}
      />
    );
  }

  return (
    <ProductFinanceClientServicesPanel
      projectId={projectId}
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
