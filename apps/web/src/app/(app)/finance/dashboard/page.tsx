'use client';

import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/* ───────── Types ───────── */

interface FinanceKpi {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number }>;
  iconBg: string;
  iconText: string;
}

interface MonthRevenue {
  month: string;
  value: number;
}

interface InvoiceStatus {
  label: string;
  count: number;
  amount: string;
  color: string;
  pct: number;
}

interface PaymentItem {
  client: string;
  invoice: string;
  amount: string;
  date: string;
  status: 'completed' | 'refunded';
}

interface InvoiceDeadline {
  invoice: string;
  client: string;
  amount: string;
  dueDate: string;
  daysLeft: number;
}

/* ───────── Mock data ───────── */

const FINANCE_KPIS: FinanceKpi[] = [
  {
    label: 'Total Revenue',
    value: '֏18,640,000',
    change: '+22% vs last quarter',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  {
    label: 'Outstanding',
    value: '֏3,240,000',
    change: '12 pending invoices',
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  {
    label: 'Overdue',
    value: '֏860,000',
    change: '3 invoices past due',
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
  },
  {
    label: 'MRR',
    value: '֏2,180,000',
    change: '+8.5% growth',
    icon: RefreshCw,
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
];

const MONTHLY_REVENUE: MonthRevenue[] = [
  { month: 'Oct', value: 2800000 },
  { month: 'Nov', value: 3200000 },
  { month: 'Dec', value: 3600000 },
  { month: 'Jan', value: 2900000 },
  { month: 'Feb', value: 3800000 },
  { month: 'Mar', value: 4200000 },
];

const INVOICE_STATUSES: InvoiceStatus[] = [
  { label: 'Paid', count: 48, amount: '֏14,200,000', color: 'bg-emerald-500', pct: 68 },
  { label: 'Pending', count: 12, amount: '֏3,240,000', color: 'bg-amber-500', pct: 20 },
  { label: 'Overdue', count: 3, amount: '֏860,000', color: 'bg-red-500', pct: 8 },
  { label: 'Draft', count: 5, amount: '֏340,000', color: 'bg-gray-400', pct: 4 },
];

const RECENT_PAYMENTS: PaymentItem[] = [
  {
    client: 'ArmenTech LLC',
    invoice: 'INV-0234',
    amount: '֏1,200,000',
    date: '2h ago',
    status: 'completed',
  },
  {
    client: 'SkyNet Solutions',
    invoice: 'INV-0231',
    amount: '֏480,000',
    date: '5h ago',
    status: 'completed',
  },
  {
    client: 'GreenLine Co.',
    invoice: 'INV-0228',
    amount: '֏320,000',
    date: '1d ago',
    status: 'completed',
  },
  {
    client: 'DigiPay Inc.',
    invoice: 'INV-0225',
    amount: '֏85,000',
    date: '2d ago',
    status: 'refunded',
  },
  {
    client: 'CloudHost AM',
    invoice: 'INV-0222',
    amount: '֏640,000',
    date: '3d ago',
    status: 'completed',
  },
];

const UPCOMING_INVOICES: InvoiceDeadline[] = [
  { invoice: 'INV-0240', client: 'TechCorp', amount: '֏950,000', dueDate: 'Mar 14', daysLeft: 3 },
  {
    invoice: 'INV-0241',
    client: 'ArmenTech LLC',
    amount: '֏1,800,000',
    dueDate: 'Mar 16',
    daysLeft: 5,
  },
  {
    invoice: 'INV-0242',
    client: 'Nova Design',
    amount: '֏420,000',
    dueDate: 'Mar 18',
    daysLeft: 7,
  },
  {
    invoice: 'INV-0243',
    client: 'FastTrack AM',
    amount: '֏280,000',
    dueDate: 'Mar 20',
    daysLeft: 9,
  },
  {
    invoice: 'INV-0244',
    client: 'SkyNet Solutions',
    amount: '֏760,000',
    dueDate: 'Mar 25',
    daysLeft: 14,
  },
];

/* ───────── Components ───────── */

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

function RevenueByMonth() {
  const maxVal = Math.max(...MONTHLY_REVENUE.map((m) => m.value));

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Revenue by Month</h2>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp size={14} />
          +22% QoQ
        </span>
      </div>
      <div className="mt-6 flex items-end gap-3" style={{ height: 180 }}>
        {MONTHLY_REVENUE.map((m) => {
          const pct = (m.value / maxVal) * 100;
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {(m.value / 1_000_000).toFixed(1)}M
              </span>
              <div
                className="w-full rounded-t-lg bg-emerald-500/80 transition-all"
                style={{ height: `${pct}%` }}
              />
              <span className="text-muted-foreground text-xs">{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InvoiceDistribution() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Invoice Status</h2>
      <p className="text-muted-foreground mt-1 text-sm">68 total invoices</p>

      {/* Stacked bar */}
      <div className="mt-6 flex h-4 overflow-hidden rounded-full">
        {INVOICE_STATUSES.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {INVOICE_STATUSES.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <span className="text-foreground text-sm">{s.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">{s.count}</span>
              <span className="text-foreground w-28 text-right text-sm font-medium">
                {s.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentPayments() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Recent Payments</h2>
      <div className="mt-4 space-y-3">
        {RECENT_PAYMENTS.map((p) => (
          <div key={p.invoice} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {p.status === 'completed' ? (
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                ) : (
                  <XCircle size={14} className="shrink-0 text-red-400" />
                )}
                <p className="text-foreground truncate text-sm">{p.client}</p>
              </div>
              <p className="text-muted-foreground ml-5 text-xs">
                {p.invoice} · {p.date}
              </p>
            </div>
            <span className="text-foreground shrink-0 text-sm font-medium">{p.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingInvoices() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Upcoming Deadlines</h2>
      <div className="mt-4 space-y-3">
        {UPCOMING_INVOICES.map((inv) => (
          <div key={inv.invoice} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm">{inv.client}</p>
              <p className="text-muted-foreground text-xs">
                {inv.invoice} · {inv.dueDate}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-foreground text-sm font-medium">{inv.amount}</span>
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                  inv.daysLeft <= 3
                    ? 'bg-red-100 text-red-700'
                    : inv.daysLeft <= 7
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {inv.daysLeft}d
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Finance Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Revenue, invoices, and payment analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FINANCE_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueByMonth />
        <InvoiceDistribution />
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentPayments />
        <UpcomingInvoices />
      </div>
    </div>
  );
}
