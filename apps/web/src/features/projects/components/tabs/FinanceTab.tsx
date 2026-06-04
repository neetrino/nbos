'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DollarSign, ExternalLink, TrendingDown, TrendingUp, CreditCard } from 'lucide-react';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { useState, useMemo } from 'react';
import { EntityDriveQuickAttach } from '@/features/drive/EntityDriveQuickAttach';
import { EntityDriveFilesPanel } from '@/features/drive/EntityDriveFilesPanel';
import { buildDriveHrefWithFinanceProject } from '@/features/drive/drive-deep-link';
import { cn } from '@/lib/utils';
import { ordersListWithOpenOrderHref } from '@/features/finance/constants/order-deep-link';
import { OrderBoardCard } from '@/features/finance/components/orders/OrderBoardCard';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import { ProductTabViewHero } from '@/features/projects/components/product-tabs/ProductTabViewHero';
import { PROJECT_PRODUCTS_CARD_GRID_CLASS } from '@/features/projects/components/project-detail-layout.constants';
import { useProjectDetailViewMode } from '@/features/projects/constants/project-detail-view-storage';
import { projectOrderToFinanceOrder } from '@/features/projects/utils/project-order-finance-adapter';
import {
  FinanceDomainsSection,
  FinanceExpensesSection,
  FinanceSubscriptionsSection,
} from '@/features/projects/components/tabs/finance-tab-sections';
import type {
  ProjectOrder,
  ProjectSubscription,
  ProjectExpense,
  ProjectDomain,
} from '@/lib/api/projects';
import type { Order } from '@/lib/api/finance';
import { buttonVariants } from '@/components/ui/button';

interface FinanceTabProps {
  orders: ProjectOrder[];
  subscriptions: ProjectSubscription[];
  expenses: ProjectExpense[];
  domains: ProjectDomain[];
  projectId: string;
  project: { id: string; name: string; code: string };
  productOrderId?: string | null;
  onAfterDriveUpload?: () => void;
}

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('en-US');
}

export function FinanceTab({
  orders,
  subscriptions,
  expenses,
  domains,
  projectId,
  project,
  productOrderId,
  onAfterDriveUpload,
}: FinanceTabProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useProjectDetailViewMode();
  const [driveFilesRefreshKey, setDriveFilesRefreshKey] = useState(0);

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

  const handleOrderClick = (order: Order) => {
    router.push(ordersListWithOpenOrderHref(order.id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EntityDriveQuickAttach
            libraryKey="finance"
            entityType="PROJECT"
            entityId={projectId}
            onUploaded={() => {
              setDriveFilesRefreshKey((key) => key + 1);
              onAfterDriveUpload?.();
            }}
          />
          <EntityDriveNavAction
            href={buildDriveHrefWithFinanceProject(projectId)}
            label="Drive files"
          />
        </div>
        <EntityDriveFilesPanel
          entityType="PROJECT"
          entityId={projectId}
          driveHref={buildDriveHrefWithFinanceProject(projectId)}
          refreshKey={driveFilesRefreshKey}
        />
      </div>

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

      <section className="space-y-4">
        <ProductTabViewHero
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          trailing={
            <Link
              href="/finance/orders"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              Open Finance
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
          }
        />
        <h3 className="text-sm font-semibold">Orders ({scopedOrders.length})</h3>
        {scopedOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders linked to this product.</p>
        ) : viewMode === 'list' ? (
          <OrdersTable
            orders={financeOrders}
            boardScope="ACTIVE"
            onOrderClick={handleOrderClick}
            onCreateInvoice={() => undefined}
          />
        ) : (
          <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
            {financeOrders.map((order) => (
              <OrderBoardCard
                key={order.id}
                order={order}
                onOrderClick={handleOrderClick}
                onCreateInvoice={() => undefined}
              />
            ))}
          </div>
        )}
      </section>

      {subscriptions.length > 0 ? (
        <FinanceSubscriptionsSection subscriptions={subscriptions} />
      ) : null}
      {expenses.length > 0 ? (
        <FinanceExpensesSection expenses={expenses} projectId={projectId} />
      ) : null}
      {domains.length > 0 ? <FinanceDomainsSection domains={domains} /> : null}
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
