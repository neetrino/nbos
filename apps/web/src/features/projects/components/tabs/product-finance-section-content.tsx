'use client';

import type { ExpensesViewMode } from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import type { ClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { ProductFinanceClientServicesPanel } from '@/features/projects/components/tabs/product-finance-client-services-panel';
import { ProductFinanceExpensesPanel } from '@/features/projects/components/tabs/product-finance-expenses-panel';
import { ProductFinanceInvoicesPanel } from '@/features/projects/components/tabs/product-finance-invoices-panel';
import { ProductFinanceOrdersPanel } from '@/features/projects/components/tabs/product-finance-orders-panel';
import { ProductFinanceSubscriptionsPanel } from '@/features/projects/components/tabs/product-finance-subscriptions-panel';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import type { InvoiceViewMode } from '@/features/finance/components/invoices/invoice-page-types';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';
import type { Order } from '@/lib/api/finance';
import type { ProjectSubscription } from '@/lib/api/projects';

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
  ordersLoading: boolean;
  ordersError: string | null;
  ordersTruncated: boolean;
  onOrdersRetry: () => void;
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
  ordersLoading,
  ordersError,
  ordersTruncated,
  onOrdersRetry,
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
  if (section === 'orders') {
    return (
      <ProductFinanceOrdersPanel
        orders={financeOrders}
        loading={ordersLoading}
        error={ordersError}
        truncated={ordersTruncated}
        search={search}
        filters={filters}
        view={ordersView}
        onRetry={onOrdersRetry}
      />
    );
  }

  if (section === 'invoices') {
    return (
      <ProductFinanceInvoicesPanel
        productId={productId}
        productName={productName}
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
