'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Globe, RefreshCw, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { OrdersBoardView } from '@/features/finance/components/orders/OrdersBoardView';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import {
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import {
  FinanceDomainsSection,
  FinanceSubscriptionsSection,
} from '@/features/projects/components/tabs/finance-tab-sections';
import { ProductFinanceExpensesPanel } from '@/features/projects/components/tabs/product-finance-expenses-panel';
import type { ExpensesViewMode } from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import {
  filterProductFinanceDomains,
  filterProductFinanceOrders,
  filterProductFinanceSubscriptions,
} from '@/features/projects/utils/filter-product-finance-data';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';
import type { Order } from '@/lib/api/finance';
import type { ProjectDomain, ProjectSubscription } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProductFinanceSectionContentProps {
  section: ProductFinanceSection;
  search: string;
  filters: Record<string, string>;
  ordersView: OrderViewMode;
  expensesView: ExpensesViewMode;
  financeOrders: Order[];
  subscriptions: ProjectSubscription[];
  domains: ProjectDomain[];
  projectId: string;
}

export function ProductFinanceSectionContent({
  section,
  search,
  filters,
  ordersView,
  expensesView,
  financeOrders,
  subscriptions,
  domains,
  projectId,
}: ProductFinanceSectionContentProps) {
  const router = useRouter();

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

    return ordersView === 'list' ? (
      <OrdersTable
        orders={displayOrders}
        boardScope={boardScope}
        onOrderClick={(order) => router.push(ordersListWithOpenOrderHref(order.id))}
        onCreateInvoice={() => undefined}
      />
    ) : (
      <OrdersBoardView
        orders={displayOrders}
        boardScope={boardScope}
        onOrderClick={(order) => router.push(ordersListWithOpenOrderHref(order.id))}
        onCreateInvoice={() => undefined}
      />
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
    return <FinanceSubscriptionsSection subscriptions={rows} />;
  }

  if (section === 'expenses') {
    return (
      <ProductFinanceExpensesPanel
        projectId={projectId}
        search={search}
        filters={filters}
        view={expensesView}
      />
    );
  }

  const rows = filterProductFinanceDomains(domains, search, filters);
  if (rows.length === 0) {
    return (
      <FinanceSectionEmpty
        icon={Globe}
        title="No domains"
        description="No domains match your filters for this project."
        href="/finance/client-services"
        linkLabel="Open Client services in Finance"
      />
    );
  }
  return <FinanceDomainsSection domains={rows} />;
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
