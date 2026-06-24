import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import { FINANCE_DASHBOARD_PANEL_CARD_CLASS } from '@/features/finance/constants/finance-dashboard-card-hover';
import type { InvoiceStatusItem } from './finance-dashboard-data';

const INVOICES_HREF = '/finance/invoices';

const INVOICE_STATUS_ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_2.75rem_2.25rem_minmax(5.5rem,auto)] items-center gap-x-3';

const INVOICE_STATUS_ITEM_SHELL =
  'border-border/70 rounded-xl border bg-white px-3 py-3 dark:bg-white';
const INVOICE_STATUS_TOTAL_SHELL = 'bg-muted/45 rounded-xl px-3 py-3';

export function InvoiceDistribution({ items }: { items: InvoiceStatusItem[] }) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={FINANCE_DASHBOARD_PANEL_CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-full bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <FileText size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">Invoice Status</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">{totalCount} total invoices</p>
          </div>
        </div>
        <Link
          href={INVOICES_HREF}
          aria-label="Open invoices"
          className="text-muted-foreground hover:text-foreground hover:border-border border-border/70 bg-background inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
        >
          <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-5 text-sm">No invoices in this period.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((item) => (
            <InvoiceStatusRow key={item.label} item={item} />
          ))}
          <InvoiceStatusTotalRow count={totalCount} amount={totalAmount} />
        </div>
      )}
    </div>
  );
}

function InvoiceStatusRow({ item }: { item: InvoiceStatusItem }) {
  return (
    <div className={cn(INVOICE_STATUS_ROW_GRID, INVOICE_STATUS_ITEM_SHELL)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('size-2.5 shrink-0 rounded-full', item.color)} aria-hidden />
        <span className="text-foreground truncate text-sm font-medium">{item.label}</span>
      </div>
      <span className="text-muted-foreground text-right text-xs tabular-nums">{item.pct}%</span>
      <span className="text-muted-foreground text-right text-sm tabular-nums">{item.count}</span>
      <span className="text-foreground text-right text-sm font-medium tabular-nums">
        {formatAmount(item.amount)}
      </span>
    </div>
  );
}

function InvoiceStatusTotalRow({ count, amount }: { count: number; amount: number }) {
  return (
    <div className={cn(INVOICE_STATUS_ROW_GRID, INVOICE_STATUS_TOTAL_SHELL)}>
      <span className="text-muted-foreground text-sm font-semibold">Total</span>
      <span className="text-muted-foreground text-right text-xs tabular-nums">100%</span>
      <span className="text-foreground text-right text-sm font-semibold tabular-nums">{count}</span>
      <span className="text-foreground text-right text-sm font-bold tabular-nums">
        {formatAmount(amount)}
      </span>
    </div>
  );
}
