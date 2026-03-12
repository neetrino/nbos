'use client';

import { FileText } from 'lucide-react';
import type { Deal } from '@/lib/api/deals';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '../constants/dealPipeline';

interface DealInvoiceTabProps {
  deal: Deal;
}

export function DealInvoiceTab({ deal }: DealInvoiceTabProps) {
  if (deal.orders.length > 0) {
    return (
      <div className="space-y-3">
        {deal.orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-2xl border border-stone-100 p-4 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">{order.code}</p>
                <StatusBadge label={order.status.replace(/_/g, ' ')} variant="blue" />
              </div>
            </div>
            <span className="text-foreground text-sm font-bold tabular-nums">
              {formatAmount(order.totalAmount)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
        <FileText size={24} className="text-stone-400" />
      </div>
      <h3 className="text-foreground mb-1.5 text-sm font-semibold">Invoices & Orders</h3>
      <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
        Invoices and orders linked to this deal will appear here
      </p>
    </div>
  );
}
