'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, ShoppingCart, DollarSign, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { ordersApi, type Order, type OrderStats } from '@/lib/api/finance';

const ORDER_STATUSES: Record<
  string,
  { label: string; variant: 'green' | 'blue' | 'amber' | 'red' | 'gray' }
> = {
  NEW: { label: 'New', variant: 'blue' },
  PREPAID: { label: 'Prepaid', variant: 'amber' },
  PARTIALLY_PAID: { label: 'Partially Paid', variant: 'amber' },
  FULLY_PAID: { label: 'Fully Paid', variant: 'green' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  CLOSED: { label: 'Closed', variant: 'gray' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [data, orderStats] = await Promise.all([
        ordersApi.getAll({
          pageSize: 100,
          search: search || undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        }),
        ordersApi.getStats(),
      ]);
      setOrders(data.items);
      setStats(orderStats);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalOrders = Number(stats?.totalAmount ?? 0);
  const totalPaid = Number(stats?.collectedAmount ?? 0);
  const outstandingAmount = Number(stats?.outstandingAmount ?? 0);

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
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          New Order
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Orders</p>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalOrders)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Collected</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Outstanding</p>
          <p className="mt-1 text-xl font-bold text-amber-500">{formatAmount(outstandingAmount)}</p>
        </div>
      </div>

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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
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
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusCfg = ORDER_STATUSES[order.status];
                const total = parseFloat(order.amount ?? '0');
                const paid = Number(order.paidAmount ?? 0);
                const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">{order.code}</p>
                    </TableCell>
                    <TableCell>
                      {order.project ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <FolderKanban size={12} className="text-muted-foreground" />
                          {order.project.name}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.company?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs">{order.type}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className="flex items-center justify-end gap-1 font-semibold">
                          <DollarSign size={12} className="text-accent" />
                          {formatAmount(total)}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={paidPercent} className="h-1.5 w-16" />
                          <span className="text-muted-foreground text-[10px]">{paidPercent}%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{order.paymentType}</TableCell>
                    <TableCell>
                      {statusCfg && (
                        <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {order._count?.invoices ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
