'use client';

import { useMemo, useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, CreditCard } from 'lucide-react';
import {
  IntegratedSearchFilters,
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
} from '@/components/shared';
import { productFinanceExpenseAllowsKanban } from '@/features/projects/utils/resolve-product-finance-scope';
import { ORDER_VIEW_OPTIONS } from '@/features/finance/components/orders/order-view-options';
import { EXPENSES_VIEW_OPTIONS } from '@/features/finance/components/expenses/expenses-view-options';
import { CLIENT_SERVICES_VIEW_OPTIONS } from '@/features/finance/components/client-services/client-services-view-options';
import { projectExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import { useClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';
import { useExpensesBoardViewMode } from '@/features/finance/constants/expenses-board-view';
import { useOrdersBoardViewMode } from '@/features/finance/constants/orders-board-view';
import { useInvoicesBoardViewMode } from '@/features/finance/constants/invoices-board-view';
import { INVOICE_VIEW_OPTIONS } from '@/features/finance/components/invoices/invoice-view-options';
import { getOrderTotalAmount } from '@/features/finance/components/orders/order-display-utils';
import { ProductFinanceSectionContent } from '@/features/projects/components/tabs/product-finance-section-content';
import { ProductFinanceHeroTrailing } from '@/features/projects/components/tabs/product-finance-hero-trailing';
import { useProductFinanceExpenseTotal } from '@/features/projects/hooks/use-product-finance-expense-total';
import { useProductFinanceOrders } from '@/features/projects/hooks/use-product-finance-orders';
import { PRODUCT_FINANCE_SECTION_OPTIONS } from '@/features/projects/constants/product-finance-section';
import { useProductFinanceSection } from '@/features/projects/hooks/use-product-finance-section';
import type { ProjectSubscription } from '@/lib/api/projects';
import type { Order } from '@/lib/api/finance';
import { usePermission } from '@/lib/permissions';
import {
  formatProjectFinanceAmount,
  projectSubscriptionMonthlyAmount,
} from '@/features/projects/utils/project-finance-amount';
import { scopeProductFinanceSubscriptions } from '@/features/projects/utils/filter-product-finance-data';

interface FinanceTabProps {
  subscriptions: ProjectSubscription[];
  projectId: string;
  productId: string;
  productName: string;
  companyId?: string | null;
  onSubscriptionsRefresh: () => void;
}

export function FinanceTab({
  subscriptions,
  projectId,
  productId,
  productName,
  companyId,
  onSubscriptionsRefresh,
}: FinanceTabProps) {
  const { can } = usePermission();
  const financeSection = useProductFinanceSection();
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const canCreateSubscription = can('ADD', 'FINANCE_SUBSCRIPTIONS');
  const [ordersView, setOrdersView] = useOrdersBoardViewMode();
  const [invoicesView, setInvoicesView] = useInvoicesBoardViewMode();
  const [expensesView, setExpensesView] = useExpensesBoardViewMode();
  const [clientServicesView, setClientServicesView] = useClientServicesViewMode();
  const displayOrdersView = useMobilePreferredView(ordersView, 'board');
  const displayInvoicesView = useMobilePreferredView(invoicesView, 'kanban');
  const displayExpensesView = useMobilePreferredView(expensesView, 'kanban');
  const displayClientServicesView = useMobilePreferredView(clientServicesView, 'status');

  const {
    orders: financeOrders,
    loading: ordersLoading,
    error: ordersError,
    truncated: ordersTruncated,
    refetch: refetchOrders,
  } = useProductFinanceOrders(projectId);

  const totalRevenue = financeOrders.reduce((sum, order) => sum + getOrderTotalAmount(order), 0);
  const totalPaid = financeOrders.reduce((sum, order) => sum + getOrderReceivedAmount(order), 0);
  const totalExpenses = useProductFinanceExpenseTotal(productId);
  const productSubscriptions = useMemo(
    () => scopeProductFinanceSubscriptions(subscriptions, productId),
    [productId, subscriptions],
  );
  const monthlyMRR = productSubscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, sub) => sum + projectSubscriptionMonthlyAmount(sub), 0);

  const openFinanceHref =
    financeSection.activeSection === 'invoices'
      ? '/finance/invoices'
      : financeSection.activeSection === 'subscriptions'
        ? '/finance/subscriptions'
        : financeSection.activeSection === 'expenses'
          ? projectExpensesDrilldownHref(projectId)
          : financeSection.activeSection === 'client-services'
            ? '/finance/client-services'
            : '/finance/orders';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FinanceStatCard
          icon={DollarSign}
          tone="text-emerald-500"
          label="Total Revenue"
          value={formatProjectFinanceAmount(totalRevenue)}
        />
        <FinanceStatCard
          icon={TrendingUp}
          tone="text-blue-500"
          label="Received"
          value={formatProjectFinanceAmount(totalPaid)}
        />
        <FinanceStatCard
          icon={TrendingDown}
          tone="text-red-500"
          label="Expenses"
          value={formatProjectFinanceAmount(totalExpenses)}
        />
        <FinanceStatCard
          icon={CreditCard}
          tone="text-purple-500"
          label="MRR"
          value={formatProjectFinanceAmount(monthlyMRR)}
        />
      </div>

      <PageHero
        title="Product finance"
        syncModuleTitle={false}
        className="mt-0"
        create={
          financeSection.activeSection === 'subscriptions' && canCreateSubscription
            ? { onSelect: () => setCreateSubscriptionOpen(true) }
            : undefined
        }
        tabs={
          <PageHeroTabs
            value={financeSection.activeSection}
            onChange={(section) => {
              if (section !== 'subscriptions') setCreateSubscriptionOpen(false);
              financeSection.setActiveSection(section);
            }}
            options={PRODUCT_FINANCE_SECTION_OPTIONS}
            ariaLabel="Product finance section"
          />
        }
        search={
          <IntegratedSearchFilters
            search={financeSection.search}
            onSearchChange={financeSection.setSearch}
            searchPlaceholder={financeSection.searchPlaceholder}
            filters={financeSection.filterConfigs}
            filterValues={financeSection.filterValuesForUi}
            onFilterChange={financeSection.handleFilterChange}
            onClearAll={financeSection.clearFilters}
          />
        }
        viewMode={
          financeSection.activeSection === 'orders' ? (
            <ViewModeSwitch
              value={ordersView}
              onChange={setOrdersView}
              options={ORDER_VIEW_OPTIONS}
            />
          ) : financeSection.activeSection === 'invoices' ? (
            <ViewModeSwitch
              value={invoicesView}
              onChange={setInvoicesView}
              options={INVOICE_VIEW_OPTIONS}
            />
          ) : financeSection.activeSection === 'expenses' &&
            productFinanceExpenseAllowsKanban(financeSection.filters) ? (
            <ViewModeSwitch
              value={expensesView}
              onChange={setExpensesView}
              options={EXPENSES_VIEW_OPTIONS}
            />
          ) : financeSection.activeSection === 'client-services' ? (
            <ViewModeSwitch
              value={clientServicesView}
              onChange={setClientServicesView}
              options={CLIENT_SERVICES_VIEW_OPTIONS}
              ariaLabel="Client services view mode"
            />
          ) : undefined
        }
        trailing={
          <ProductFinanceHeroTrailing
            projectId={projectId}
            openFinanceHref={openFinanceHref}
            showCreateSubscription={
              financeSection.activeSection === 'subscriptions' && canCreateSubscription
            }
            onCreateSubscription={() => setCreateSubscriptionOpen(true)}
          />
        }
      />

      <div
        className={
          (financeSection.activeSection === 'orders' && displayOrdersView === 'board') ||
          (financeSection.activeSection === 'invoices' && displayInvoicesView === 'kanban') ||
          (financeSection.activeSection === 'expenses' && displayExpensesView === 'kanban') ||
          (financeSection.activeSection === 'client-services' &&
            (displayClientServicesView === 'status' || displayClientServicesView === 'months'))
            ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
            : undefined
        }
      >
        <ProductFinanceSectionContent
          section={financeSection.activeSection}
          search={financeSection.search}
          debouncedSearch={financeSection.debouncedSearch}
          filters={financeSection.filters}
          ordersView={displayOrdersView}
          invoicesView={displayInvoicesView}
          expensesView={displayExpensesView}
          clientServicesView={displayClientServicesView}
          financeOrders={financeOrders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          ordersTruncated={ordersTruncated}
          onOrdersRetry={() => void refetchOrders()}
          subscriptions={productSubscriptions}
          projectId={projectId}
          productId={productId}
          productName={productName}
          companyId={companyId}
          canCreateSubscription={canCreateSubscription}
          createSubscriptionOpen={createSubscriptionOpen}
          onCreateSubscriptionOpenChange={setCreateSubscriptionOpen}
          onSubscriptionsRefresh={onSubscriptionsRefresh}
        />
      </div>
    </div>
  );
}

function FinanceStatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof DollarSign;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className={tone} />
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function getOrderReceivedAmount(order: Order): number {
  return order.reconciliation?.paidAmount ?? order.paidAmount ?? 0;
}
