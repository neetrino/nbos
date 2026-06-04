'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  DollarSign,
  ExternalLink,
  HardDrive,
  TrendingDown,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import {
  IntegratedSearchFilters,
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
} from '@/components/shared';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import { buildDriveHrefWithFinanceProject } from '@/features/drive/drive-deep-link';
import { cn } from '@/lib/utils';
import { ORDER_VIEW_OPTIONS } from '@/features/finance/components/orders/order-view-options';
import { EXPENSES_VIEW_OPTIONS } from '@/features/finance/components/expenses/expenses-view-options';
import { CLIENT_SERVICES_VIEW_OPTIONS } from '@/features/finance/components/client-services/client-services-view-options';
import { projectExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import { useClientServicesViewMode } from '@/features/finance/constants/client-services-view';
import { useExpensesBoardViewMode } from '@/features/finance/constants/expenses-board-view';
import { useOrdersBoardViewMode } from '@/features/finance/constants/orders-board-view';
import { projectOrderToFinanceOrder } from '@/features/projects/utils/project-order-finance-adapter';
import { ProductFinanceSectionContent } from '@/features/projects/components/tabs/product-finance-section-content';
import { PRODUCT_FINANCE_SECTION_OPTIONS } from '@/features/projects/constants/product-finance-section';
import { useProductFinanceSection } from '@/features/projects/hooks/use-product-finance-section';
import type { ProjectExpense, ProjectOrder, ProjectSubscription } from '@/lib/api/projects';
import { buttonVariants } from '@/components/ui/button';

interface FinanceTabProps {
  orders: ProjectOrder[];
  subscriptions: ProjectSubscription[];
  expenses: ProjectExpense[];
  projectId: string;
  project: { id: string; name: string; code: string };
  productOrderId?: string | null;
}

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('en-US');
}

export function FinanceTab({
  orders,
  subscriptions,
  expenses,
  projectId,
  project,
  productOrderId,
}: FinanceTabProps) {
  const financeSection = useProductFinanceSection();
  const [ordersView, setOrdersView] = useOrdersBoardViewMode();
  const [expensesView, setExpensesView] = useExpensesBoardViewMode();
  const [clientServicesView, setClientServicesView] = useClientServicesViewMode();

  const scopedOrders = useMemo(() => {
    if (!productOrderId) return orders;
    return orders.filter((order) => order.id === productOrderId);
  }, [orders, productOrderId]);

  const financeOrders = useMemo(
    () => scopedOrders.map((order) => projectOrderToFinanceOrder(order, project)),
    [scopedOrders, project],
  );

  const totalRevenue = scopedOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const paidInvoices = scopedOrders
    .flatMap((o) => o.invoices)
    .filter((i) => i.moneyStatus === 'PAID');
  const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlyMRR = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((s, sub) => s + Number(sub.amount), 0);

  const openFinanceHref =
    financeSection.activeSection === 'subscriptions'
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
          value={formatAmount(totalRevenue)}
        />
        <FinanceStatCard
          icon={TrendingUp}
          tone="text-blue-500"
          label="Received"
          value={formatAmount(totalPaid)}
        />
        <FinanceStatCard
          icon={TrendingDown}
          tone="text-red-500"
          label="Expenses"
          value={formatAmount(totalExpenses)}
        />
        <FinanceStatCard
          icon={CreditCard}
          tone="text-purple-500"
          label="MRR"
          value={formatAmount(monthlyMRR)}
        />
      </div>

      <PageHero
        title="Product finance"
        syncModuleTitle={false}
        className="mt-0"
        tabs={
          <PageHeroTabs
            value={financeSection.activeSection}
            onChange={financeSection.setActiveSection}
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
          ) : financeSection.activeSection === 'expenses' &&
            financeSection.filters[EXPENSE_BOARD_SCOPE_FILTER_KEY] !== 'backlog' ? (
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
          <>
            <Link
              href={buildDriveHrefWithFinanceProject(projectId)}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <HardDrive size={14} aria-hidden />
              Drive
            </Link>
            <Link
              href={openFinanceHref}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              Finance
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
          </>
        }
      />

      <div
        className={
          (financeSection.activeSection === 'orders' && ordersView === 'board') ||
          (financeSection.activeSection === 'expenses' && expensesView === 'kanban') ||
          (financeSection.activeSection === 'client-services' &&
            (clientServicesView === 'status' || clientServicesView === 'months'))
            ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
            : undefined
        }
      >
        <ProductFinanceSectionContent
          section={financeSection.activeSection}
          search={financeSection.search}
          filters={financeSection.filters}
          ordersView={ordersView}
          expensesView={expensesView}
          clientServicesView={clientServicesView}
          financeOrders={financeOrders}
          subscriptions={subscriptions}
          projectId={projectId}
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
