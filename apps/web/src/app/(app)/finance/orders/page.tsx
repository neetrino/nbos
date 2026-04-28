'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCcw, ShoppingCart, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader, FilterBar, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import {
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
} from '@/features/finance/constants/finance';
import {
  ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE,
  ORDER_RECONCILIATION_GAP,
  ORDER_RECONCILIATION_GAP_QUERY,
  type OrderReconciliationGap,
  filterOrdersByReconciliationGap,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';
import { OrdersStatsCards } from '@/features/finance/components/orders/OrdersStatsCards';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import { ordersApi, type Order, type OrderStats } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gap = parseOrderReconciliationGap(searchParams.get(ORDER_RECONCILIATION_GAP_QUERY));

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const pageSize = gap ? ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE : 100;
      const [data, orderStats] = await Promise.all([
        ordersApi.getAll({
          pageSize,
          search: search || undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          ...periodParams,
        }),
        ordersApi.getStats(periodParams),
      ]);
      setOrders(data.items);
      setStats(orderStats);
      setError(null);
    } catch {
      setError('Orders could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, period, gap]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const displayedOrders = useMemo(() => {
    if (!gap) return orders;
    return filterOrdersByReconciliationGap(orders, gap);
  }, [orders, gap]);

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
        value,
        label: cfg.label,
      })),
    },
  ];

  const description = buildOrdersDescription(orders.length, displayedOrders.length, gap);

  const clearReconciliationGap = () => {
    router.replace('/finance/orders');
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Orders" description={description}>
        <div className="border-border flex rounded-lg border p-1">
          {FINANCE_PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          New Order
        </Button>
      </PageHeader>

      {gap ? <ReconciliationGapBanner gap={gap} onClear={clearReconciliationGap} /> : null}

      <OrdersStatsCards stats={stats} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order code, project..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Orders are created from closed deals"
          action={
            <Button>
              <Plus size={16} />
              Create Order
            </Button>
          }
        />
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders match this reconciliation filter"
          description="Try clearing the filter or loading more orders by widening the period."
          action={
            <Button variant="outline" onClick={clearReconciliationGap}>
              <X size={16} />
              Clear reconciliation filter
            </Button>
          }
        />
      ) : (
        <OrdersTable orders={displayedOrders} onCreateInvoice={setInvoiceOrder} />
      )}
      <CreateInvoiceDialog
        open={Boolean(invoiceOrder)}
        order={invoiceOrder}
        onOpenChange={(open) => {
          if (!open) setInvoiceOrder(null);
        }}
        onCreated={fetchOrders}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersPageContent />
    </Suspense>
  );
}

function ReconciliationGapBanner({
  gap,
  onClear,
}: {
  gap: OrderReconciliationGap;
  onClear: () => void;
}) {
  const label =
    gap === ORDER_RECONCILIATION_GAP.UNINVOICED
      ? 'Showing orders with uninvoiced amounts (among loaded orders).'
      : 'Showing orders with outstanding payment amounts (among loaded orders).';

  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/finance/dashboard"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back to Finance dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X size={14} className="mr-1" />
          Clear filter
        </Button>
      </div>
    </div>
  );
}

function buildOrdersDescription(
  loadedCount: number,
  visibleCount: number,
  gap: ReturnType<typeof parseOrderReconciliationGap>,
): string {
  if (!gap) {
    return `${loadedCount} orders`;
  }
  return `${visibleCount} orders (filtered from ${loadedCount} loaded)`;
}
