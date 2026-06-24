import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/features/finance/constants/finance';
import { FINANCE_DASHBOARD_PANEL_CARD_CLASS } from '@/features/finance/constants/finance-dashboard-card-hover';
import type { InvoiceStatusItem } from './finance-dashboard-data';

const INVOICES_HREF = '/finance/invoices';

const INVOICE_STATUS_ITEM_SHELL =
  'border-border/70 flex items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3.5 dark:bg-white';
const INVOICE_STATUS_TOTAL_SHELL =
  'bg-muted/45 flex items-center justify-between gap-4 rounded-xl px-4 py-3.5';

const INVOICE_STATUS_VALUES_CLASS = 'flex shrink-0 items-center gap-4 tabular-nums';

export function InvoiceDistribution({ items }: { items: InvoiceStatusItem[] }) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={cn(FINANCE_DASHBOARD_PANEL_CARD_CLASS, 'flex h-full flex-col')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-full bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <FileText size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">Invoice Status</h2>
            <p className="text-muted-foreground mt-0.5 text-base">{totalCount} total invoices</p>
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
        <div className="mt-5 flex flex-1 flex-col gap-2">
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
    <div className={cn(INVOICE_STATUS_ITEM_SHELL, 'min-h-12 flex-1')}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('size-3 shrink-0 rounded-full', item.color)} aria-hidden />
        <span className="text-foreground truncate text-base font-medium">{item.label}</span>
      </div>
      <div className={INVOICE_STATUS_VALUES_CLASS}>
        <span className="text-muted-foreground w-10 text-right text-xs">{item.pct}%</span>
        <span className="text-muted-foreground w-8 text-right text-sm">{item.count}</span>
        <span className="text-foreground min-w-[7.5rem] text-right text-sm font-medium">
          {formatAmount(item.amount)}
        </span>
      </div>
    </div>
  );
}

function InvoiceStatusTotalRow({ count, amount }: { count: number; amount: number }) {
  return (
    <div className={cn(INVOICE_STATUS_TOTAL_SHELL, 'min-h-12 flex-1')}>
      <span className="text-muted-foreground text-base font-semibold">Total</span>
      <div className={INVOICE_STATUS_VALUES_CLASS}>
        <span className="text-muted-foreground w-10 text-right text-xs">100%</span>
        <span className="text-foreground w-8 text-right text-sm font-semibold">{count}</span>
        <span className="text-foreground min-w-[7.5rem] text-right text-sm font-bold">
          {formatAmount(amount)}
        </span>
      </div>
    </div>
  );
}
