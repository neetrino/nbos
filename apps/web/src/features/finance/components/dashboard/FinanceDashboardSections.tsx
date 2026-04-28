import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  orderReconciliationDrilldownHref,
  orderReconciliationGapForFinanceWarningCode,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import type {
  FinanceDashboardData,
  FinanceKpi,
  InvoiceStatusItem,
  RecentPaymentItem,
  UpcomingInvoiceItem,
} from './finance-dashboard-data';

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: FinanceKpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}

export function InvoiceDistribution({ items }: { items: InvoiceStatusItem[] }) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Invoice Status</h2>
      <p className="text-muted-foreground mt-1 text-sm">{totalCount} total invoices</p>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <InvoiceStatusRow key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

export function RecentPayments({ items }: { items: RecentPaymentItem[] }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Recent Payments</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payments yet.</p>
        ) : (
          items.map((item) => <RecentPaymentRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

export function UpcomingInvoices({ items }: { items: UpcomingInvoiceItem[] }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Upcoming Deadlines</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No unpaid invoices with due dates.</p>
        ) : (
          items.map((item) => <UpcomingInvoiceRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

export function ReconciliationSnapshot({ data }: { data: FinanceDashboardData }) {
  const { reconciliation } = data;
  const invoiceCoverage = getPercent(reconciliation.invoicedAmount, reconciliation.orderAmount);
  const paymentCoverage = getPercent(reconciliation.paidAmount, reconciliation.orderAmount);

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Order Reconciliation</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Read-only coverage across {reconciliation.orderCount} finance orders.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Order amount" value={formatAmount(reconciliation.orderAmount)} />
        <Metric label="Paid amount" value={formatAmount(reconciliation.paidAmount)} />
        <Metric label="Uninvoiced" value={formatAmount(reconciliation.uninvoicedAmount)} />
        <Metric label="Outstanding" value={formatAmount(reconciliation.outstandingAmount)} />
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <Coverage
          label="Invoice coverage"
          covered={reconciliation.fullyInvoicedCount}
          percent={invoiceCoverage}
        />
        <Coverage
          label="Payment coverage"
          covered={reconciliation.fullyPaidCount}
          percent={paymentCoverage}
        />
      </div>

      <ReconciliationWarnings data={data} />
    </div>
  );
}

export function FinanceNotes() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Finance Notes</h2>
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-muted-foreground">
          Dashboard values are derived from live invoice, payment, order, and subscription data.
        </p>
        <p className="text-muted-foreground">
          Period selection filters created invoices, recognized paid revenue, and recent payment
          activity while bounding upcoming deadlines by the chosen end date.
        </p>
        <p className="text-muted-foreground">
          MRR is calculated from active subscriptions only, matching the subscriptions page.
        </p>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: FinanceKpi }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${kpi.iconBg} ${kpi.iconText}`}>
          <kpi.icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground" />
      </div>
      <div className="mt-4">
        <p className="text-foreground text-2xl font-semibold">{kpi.value}</p>
        <p className="text-muted-foreground mt-1 text-sm">{kpi.label}</p>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">{kpi.change}</p>
    </div>
  );
}

function InvoiceStatusRow({ item }: { item: InvoiceStatusItem }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${item.color}`} />
        <span className="text-foreground text-sm">{item.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-xs">{item.pct}%</span>
        <span className="text-muted-foreground text-sm">{item.count}</span>
        <span className="text-foreground w-28 text-right text-sm font-medium">
          {formatAmount(item.amount)}
        </span>
      </div>
    </div>
  );
}

function RecentPaymentRow({ item }: { item: RecentPaymentItem }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
          <p className="text-foreground truncate text-sm">{item.client}</p>
        </div>
        <p className="text-muted-foreground ml-5 text-xs">
          {item.invoice} · {item.dateLabel}
        </p>
      </div>
      <span className="text-foreground shrink-0 text-sm font-medium">
        {formatAmount(item.amount)}
      </span>
    </div>
  );
}

function UpcomingInvoiceRow({ item }: { item: UpcomingInvoiceItem }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm">{item.client}</p>
        <p className="text-muted-foreground text-xs">
          {item.invoice} · {item.dueDateLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-foreground text-sm font-medium">{formatAmount(item.amount)}</span>
        <span
          className={`rounded-lg px-2 py-0.5 text-xs font-medium ${getDaysLeftClass(item.daysLeft)}`}
        >
          {item.daysLeft}d
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Coverage({
  label,
  covered,
  percent,
}: {
  label: string;
  covered: number;
  percent: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">
        {covered} orders · {percent}%
      </span>
    </div>
  );
}

function ReconciliationWarnings({ data }: { data: FinanceDashboardData }) {
  if (data.reconciliation.warnings.length === 0) {
    return <p className="mt-4 text-sm text-emerald-600">All orders are fully invoiced and paid.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {data.reconciliation.warnings.map((warning) => (
        <div
          key={warning.code}
          className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
        >
          <div className="flex min-w-0 flex-1 gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              {warning.message} ({warning.count})
            </span>
          </div>
          <Link
            href={orderReconciliationDrilldownHref(
              orderReconciliationGapForFinanceWarningCode(warning.code),
            )}
            className="text-foreground shrink-0 text-sm font-medium underline underline-offset-2"
          >
            Open orders
          </Link>
        </div>
      ))}
    </div>
  );
}

function getDaysLeftClass(daysLeft: number): string {
  if (daysLeft <= 3) return 'bg-red-100 text-red-700';
  if (daysLeft <= 7) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
