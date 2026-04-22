'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount } from '@/features/finance/constants/finance';
import { financeSummaryApi, type FinanceDashboardSummary } from '@/lib/api/finance';

interface FinanceDashboardData {
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  monthlyRecurringRevenue: number;
  invoiceStatusItems: InvoiceStatusItem[];
  recentPayments: RecentPaymentItem[];
  upcomingInvoices: UpcomingInvoiceItem[];
}

interface FinanceKpi {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number }>;
  iconBg: string;
  iconText: string;
}

interface InvoiceStatusItem {
  label: string;
  count: number;
  amount: number;
  color: string;
  pct: number;
}

interface RecentPaymentItem {
  id: string;
  client: string;
  invoice: string;
  amount: number;
  dateLabel: string;
}

interface UpcomingInvoiceItem {
  id: string;
  invoice: string;
  client: string;
  amount: number;
  dueDateLabel: string;
  daysLeft: number;
}

const INVOICE_STATUS_META: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Paid', color: 'bg-emerald-500' },
  WAITING: { label: 'Waiting', color: 'bg-violet-500' },
  CREATE_INVOICE: { label: 'Create Invoice', color: 'bg-indigo-500' },
  THIS_MONTH: { label: 'This Month', color: 'bg-blue-500' },
  DELAYED: { label: 'Delayed', color: 'bg-orange-500' },
  ON_HOLD: { label: 'On Hold', color: 'bg-gray-400' },
  FAIL: { label: 'Fail', color: 'bg-red-500' },
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toAmount(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function formatRelativeDate(dateValue: string): string {
  const target = new Date(dateValue);
  const today = startOfToday();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function getDaysLeft(dueDate: string): number {
  const target = new Date(dueDate);
  const today = startOfToday();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((targetDay.getTime() - today.getTime()) / 86_400_000);
}

function buildFinanceDashboardData(summary: FinanceDashboardSummary): FinanceDashboardData {
  const totalRevenue = toAmount(summary.kpis.totalRevenue);
  const outstandingAmount = toAmount(summary.kpis.outstandingAmount);
  const overdueAmount = toAmount(summary.kpis.overdueAmount);
  const monthlyRecurringRevenue = toAmount(summary.kpis.monthlyRecurringRevenue);
  const totalInvoices = summary.invoiceStatusItems.reduce((sum, item) => sum + item.count, 0) || 1;

  const invoiceStatusItems = Object.entries(INVOICE_STATUS_META)
    .map(([status, meta]) => {
      const statusGroup = summary.invoiceStatusItems.find((item) => item.status === status);

      return {
        label: meta.label,
        count: statusGroup?.count ?? 0,
        amount: toAmount(statusGroup?.amount),
        color: meta.color,
        pct: Math.round(((statusGroup?.count ?? 0) / totalInvoices) * 100),
      };
    })
    .filter((item) => item.count > 0);

  const recentPayments = [...summary.recentPayments]
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))
    .map((payment) => ({
      id: payment.id,
      client: payment.company?.name ?? payment.project?.name ?? 'Unknown client',
      invoice: payment.invoice?.code ?? 'Unknown invoice',
      amount: toAmount(payment.amount),
      dateLabel: formatRelativeDate(payment.paymentDate),
    }));

  const upcomingInvoices = summary.upcomingInvoices
    .filter((invoice) => invoice.dueDate)
    .map((invoice) => {
      const dueDate = invoice.dueDate as string;
      return {
        id: invoice.id,
        invoice: invoice.code,
        client: invoice.company?.name ?? 'Unknown client',
        amount: toAmount(invoice.amount),
        dueDateLabel: new Date(dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        daysLeft: getDaysLeft(dueDate),
      };
    })
    .sort((left, right) => left.daysLeft - right.daysLeft);

  return {
    totalRevenue,
    outstandingAmount,
    overdueAmount,
    monthlyRecurringRevenue,
    invoiceStatusItems,
    recentPayments,
    upcomingInvoices,
  };
}

function DashboardLoadingSkeleton() {
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

function InvoiceDistribution({ items }: { items: InvoiceStatusItem[] }) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Invoice Status</h2>
      <p className="text-muted-foreground mt-1 text-sm">{totalCount} total invoices</p>

      <div className="mt-6 flex h-4 overflow-hidden rounded-full">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.color} transition-all`}
            style={{ width: `${item.pct}%` }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-foreground text-sm">{item.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">{item.count}</span>
              <span className="text-foreground w-28 text-right text-sm font-medium">
                {formatAmount(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentPayments({ items }: { items: RecentPaymentItem[] }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Recent Payments</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No payments yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
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
          ))
        )}
      </div>
    </div>
  );
}

function UpcomingInvoices({ items }: { items: UpcomingInvoiceItem[] }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Upcoming Deadlines</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No unpaid invoices with due dates.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm">{item.client}</p>
                <p className="text-muted-foreground text-xs">
                  {item.invoice} · {item.dueDateLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-foreground text-sm font-medium">
                  {formatAmount(item.amount)}
                </span>
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    item.daysLeft <= 3
                      ? 'bg-red-100 text-red-700'
                      : item.daysLeft <= 7
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.daysLeft}d
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await financeSummaryApi.getDashboard();
      setData(buildFinanceDashboardData(summary));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Could not load finance dashboard data</p>
        <Button onClick={fetchDashboard}>
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const kpis: FinanceKpi[] = [
    {
      label: 'Total Revenue',
      value: formatAmount(data.totalRevenue),
      change: 'From paid invoices',
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
    },
    {
      label: 'Outstanding',
      value: formatAmount(data.outstandingAmount),
      change: 'All unpaid invoices',
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: formatAmount(data.overdueAmount),
      change: 'Invoices in delayed state',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    {
      label: 'MRR',
      value: formatAmount(data.monthlyRecurringRevenue),
      change: 'Active subscriptions only',
      icon: RefreshCw,
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Finance Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revenue, invoices, and payment analytics from live finance data.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchDashboard}>
          <RefreshCw size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InvoiceDistribution items={data.invoiceStatusItems} />
        <RecentPayments items={data.recentPayments} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingInvoices items={data.upcomingInvoices} />
        <div className="border-border bg-card rounded-2xl border p-6">
          <h2 className="text-foreground text-lg font-semibold">Finance Notes</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-muted-foreground">
              Dashboard values are now derived from live `invoice`, `payment`, and `subscription`
              data instead of mock fixtures.
            </p>
            <p className="text-muted-foreground">
              `Outstanding` includes every invoice that is not `PAID`, while `Overdue` is limited to
              invoices in `DELAYED`.
            </p>
            <p className="text-muted-foreground">
              `MRR` is calculated from active subscriptions only, matching the subscriptions page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
