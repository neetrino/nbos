'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ShoppingCart, RefreshCcw, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

interface Order {
  id: string;
  code: string;
  type: string;
  paymentType: string;
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: string;
  project: { id: string; code: string; name: string };
  deal: { id: string; code: string } | null;
  _count: { invoices: number };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-500',
  PAUSED: 'bg-amber-500/10 text-amber-500',
  COMPLETED: 'bg-blue-500/10 text-blue-500',
  CANCELLED: 'bg-red-500/10 text-red-500',
};

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/finance/orders', {
        params: { pageSize: 50, search: search || undefined },
      });
      setOrders(resp.data.items ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">{orders.length} orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <ShoppingCart size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No orders yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">Orders appear when deals are won</p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Order
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Project
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Type
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                  Amount
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Invoices
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-foreground text-sm font-medium">{order.code}</p>
                    {order.deal && (
                      <p className="text-muted-foreground text-xs">Deal: {order.deal.code}</p>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-sm">{order.project.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
                      {order.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-foreground flex items-center justify-end gap-1 text-sm font-semibold">
                      <DollarSign size={12} className="text-accent" />
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-secondary text-muted-foreground'}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-center text-sm">
                    {order._count.invoices}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
