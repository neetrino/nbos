'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, FilterBar, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import {
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
} from '@/features/finance/constants/finance';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';
import { OrdersStatsCards } from '@/features/finance/components/orders/OrdersStatsCards';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import { ordersApi, type Order, type OrderStats } from '@/lib/api/finance';

export default function OrdersPage() {
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
      const [data, orderStats] = await Promise.all([
        ordersApi.getAll({
          pageSize: 100,
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
  }, [search, filters, period]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Orders" description={`${orders.length} orders`}>
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
      ) : (
        <OrdersTable orders={orders} onCreateInvoice={setInvoiceOrder} />
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
