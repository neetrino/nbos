'use client';

import {
  UserPlus,
  TrendingUp,
  Handshake,
  DollarSign,
  ArrowUpRight,
  Trophy,
  Star,
  CheckCircle2,
} from 'lucide-react';

/* ───────── Types ───────── */

interface SalesKpi {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number }>;
  iconBg: string;
  iconText: string;
}

interface LeadSource {
  source: string;
  count: number;
  color: string;
}

interface DealStage {
  label: string;
  count: number;
  value: string;
  color: string;
}

interface Performer {
  name: string;
  role: string;
  deals: number;
  revenue: string;
  avatar: string;
}

interface Conversion {
  lead: string;
  source: string;
  dealValue: string;
  date: string;
}

/* ───────── Mock data ───────── */

const SALES_KPIS: SalesKpi[] = [
  {
    label: 'Total Leads',
    value: '184',
    change: '+24 this month',
    icon: UserPlus,
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  {
    label: 'Conversion Rate',
    value: '18.4%',
    change: '+2.1% vs last month',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  {
    label: 'Active Deals',
    value: '42',
    change: '12 closing this week',
    icon: Handshake,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  {
    label: 'Pipeline Value',
    value: '֏31,600,000',
    change: '+15% vs last quarter',
    icon: DollarSign,
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
];

const LEAD_SOURCES: LeadSource[] = [
  { source: 'Website', count: 52, color: 'bg-blue-500' },
  { source: 'Referral', count: 38, color: 'bg-emerald-500' },
  { source: 'Instagram', count: 34, color: 'bg-pink-500' },
  { source: 'LinkedIn', count: 28, color: 'bg-sky-500' },
  { source: 'Cold Outreach', count: 18, color: 'bg-amber-500' },
  { source: 'Other', count: 14, color: 'bg-gray-400' },
];

const DEAL_STAGES: DealStage[] = [
  { label: 'Discovery', count: 18, value: '֏8,400,000', color: 'bg-blue-500' },
  { label: 'Proposal', count: 12, value: '֏6,800,000', color: 'bg-amber-500' },
  { label: 'Negotiation', count: 8, value: '֏9,200,000', color: 'bg-orange-500' },
  { label: 'Closing', count: 4, value: '֏7,200,000', color: 'bg-emerald-500' },
];

const TOP_PERFORMERS: Performer[] = [
  { name: 'Armen Petrosyan', role: 'Sales Lead', deals: 14, revenue: '֏8,200,000', avatar: 'AP' },
  { name: 'Lilit Sargsyan', role: 'Account Exec', deals: 11, revenue: '֏6,400,000', avatar: 'LS' },
  { name: 'David Hovhannisyan', role: 'BDR', deals: 9, revenue: '֏4,800,000', avatar: 'DH' },
];

const RECENT_CONVERSIONS: Conversion[] = [
  { lead: 'ArmenTech LLC', source: 'LinkedIn', dealValue: '֏12,500,000', date: '2h ago' },
  { lead: 'SkyNet Solutions', source: 'Website', dealValue: '֏8,200,000', date: '1d ago' },
  { lead: 'GreenLine Co.', source: 'Referral', dealValue: '֏4,800,000', date: '2d ago' },
  { lead: 'DigiPay Inc.', source: 'Instagram', dealValue: '֏3,600,000', date: '3d ago' },
  { lead: 'CloudHost AM', source: 'Cold Outreach', dealValue: '֏2,400,000', date: '4d ago' },
];

/* ───────── Components ───────── */

function KpiCard({ kpi }: { kpi: SalesKpi }) {
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

function LeadSourcesChart() {
  const maxCount = Math.max(...LEAD_SOURCES.map((s) => s.count));

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Lead Sources</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {LEAD_SOURCES.reduce((s, l) => s + l.count, 0)} total leads
      </p>
      <div className="mt-6 space-y-3">
        {LEAD_SOURCES.map((s) => {
          const pct = (s.count / maxCount) * 100;
          return (
            <div key={s.source} className="flex items-center gap-3">
              <span className="text-muted-foreground w-28 text-sm">{s.source}</span>
              <div
                className="bg-secondary flex-1 overflow-hidden rounded-full"
                style={{ height: 10 }}
              >
                <div
                  className={`h-full rounded-full ${s.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-foreground w-8 text-right text-sm font-medium">{s.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealStageFunnel() {
  const totalCount = DEAL_STAGES.reduce((s, d) => s + d.count, 0);

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Deal Stages</h2>
      <p className="text-muted-foreground mt-1 text-sm">{totalCount} active deals</p>
      <div className="mt-6 space-y-4">
        {DEAL_STAGES.map((stage, i) => {
          const widthPct = 100 - i * 18;
          return (
            <div key={stage.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-foreground text-sm">{stage.label}</span>
                <span className="text-muted-foreground text-xs">
                  {stage.count} · {stage.value}
                </span>
              </div>
              <div className="bg-secondary overflow-hidden rounded-full" style={{ height: 12 }}>
                <div
                  className={`h-full rounded-full ${stage.color} transition-all`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopPerformers() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-accent" />
        <h2 className="text-foreground text-lg font-semibold">Top Performers</h2>
      </div>
      <div className="mt-4 space-y-4">
        {TOP_PERFORMERS.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
              {p.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-foreground truncate text-sm font-medium">{p.name}</p>
                {i === 0 && <Star size={14} className="text-accent shrink-0" />}
              </div>
              <p className="text-muted-foreground text-xs">
                {p.role} · {p.deals} deals
              </p>
            </div>
            <span className="text-foreground shrink-0 text-sm font-medium">{p.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentConversions() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Recent Conversions</h2>
      <div className="mt-4 space-y-3">
        {RECENT_CONVERSIONS.map((c) => (
          <div key={c.lead} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                <p className="text-foreground truncate text-sm">{c.lead}</p>
              </div>
              <p className="text-muted-foreground ml-5 text-xs">
                {c.source} · {c.date}
              </p>
            </div>
            <span className="text-foreground shrink-0 text-sm font-medium">{c.dealValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function CrmDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Sales Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Leads, deals, and conversion analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SALES_KPIS.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeadSourcesChart />
        <DealStageFunnel />
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopPerformers />
        <RecentConversions />
      </div>
    </div>
  );
}
