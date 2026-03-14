'use client';

import { useState } from 'react';
import { FileText, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '../constants/dealPipeline';
import { invoicesApi } from '@/lib/api/finance';
import type { Deal, DealInvoice } from '@/lib/api/deals';

const INVOICE_STATUS_VARIANT: Record<
  string,
  'blue' | 'amber' | 'red' | 'green' | 'gray' | 'orange'
> = {
  THIS_MONTH: 'blue',
  CREATE_INVOICE: 'amber',
  WAITING: 'orange',
  DELAYED: 'red',
  ON_HOLD: 'gray',
  FAIL: 'red',
  PAID: 'green',
};

interface DealInvoiceTabProps {
  deal: Deal;
  onRefresh?: () => void;
}

export function DealInvoiceTab({ deal, onRefresh }: DealInvoiceTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const allInvoices: (DealInvoice & { orderCode: string })[] = (deal.orders ?? []).flatMap(
    (order) => (order.invoices ?? []).map((inv) => ({ ...inv, orderCode: order.code })),
  );

  const firstOrder = deal.orders?.[0];

  const handleCreate = async () => {
    const amount = Number(invoiceAmount);
    if (!amount || amount <= 0 || !firstOrder) return;

    setCreating(true);
    try {
      await invoicesApi.create({
        orderId: firstOrder.id,
        projectId: '',
        amount,
        type: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'DEVELOPMENT',
      });
      setShowForm(false);
      setInvoiceAmount('');
      onRefresh?.();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Invoice Button / Form */}
      {firstOrder && (
        <div>
          {showForm ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex-1">
                <label className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                  Invoice Amount (AMD)
                </label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 dark:border-stone-700 dark:bg-stone-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setShowForm(false);
                  }}
                />
              </div>
              <div className="flex gap-1.5 pt-5">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !invoiceAmount || Number(invoiceAmount) <= 0}
                  className="gap-1"
                >
                  <Check size={14} />
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setInvoiceAmount('');
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} />
              Create Invoice
            </Button>
          )}
        </div>
      )}

      {/* Invoice List */}
      {allInvoices.length > 0 ? (
        <div className="space-y-3">
          {allInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-2xl border border-stone-100 p-4 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{inv.code}</p>
                  <StatusBadge
                    label={inv.status.replace(/_/g, ' ')}
                    variant={INVOICE_STATUS_VARIANT[inv.status] ?? 'gray'}
                  />
                </div>
              </div>
              <span className="text-foreground text-sm font-bold tabular-nums">
                {formatAmount(Number(inv.amount))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
              <FileText size={24} className="text-stone-400" />
            </div>
            <h3 className="text-foreground mb-1.5 text-sm font-semibold">Invoices</h3>
            <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
              {firstOrder
                ? 'No invoices yet. Create one to track payments.'
                : 'Create an order first to start invoicing.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
