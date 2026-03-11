'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  FileText,
  RefreshCcw,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  code: string;
  amount: string;
  status: string;
  type: string;
  dueDate: string | null;
  paidDate: string | null;
  createdAt: string;
  order: { id: string; code: string } | null;
  company: { id: string; name: string } | null;
  _count: { payments: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  SENT: { label: 'Sent', color: 'bg-indigo-500/10 text-indigo-500', icon: FileText },
  PARTIAL: { label: 'Partial', color: 'bg-amber-500/10 text-amber-500', icon: AlertCircle },
  PAID: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/10 text-red-500', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-500', icon: AlertCircle },
};

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AMD',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/finance/invoices', {
        params: { pageSize: 50, search: search || undefined },
      });
      setInvoices(resp.data.items ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground mt-1 text-sm">{invoices.length} invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Invoice
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
          placeholder="Search invoices..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <FileText size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No invoices yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">Create your first invoice</p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Invoice
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Company
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium">
                  Amount
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {invoices.map((inv) => {
                const statusCfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['NEW']!;
                const StatusIcon = statusCfg!.icon;
                return (
                  <tr key={inv.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground text-sm font-medium">{inv.code}</p>
                        {inv.order && (
                          <p className="text-muted-foreground text-xs">Order: {inv.order.code}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-sm">
                      {inv.company?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-foreground flex items-center justify-end gap-1 text-sm font-semibold">
                        <DollarSign size={12} className="text-accent" />
                        {formatCurrency(inv.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-sm">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
