'use client';

import {
  DollarSign,
  FolderKanban,
  Handshake,
  FileText,
  CheckSquare,
  Headphones,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Star,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

/* ───────── Types ───────── */

interface KpiCard {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number }>;
  iconBg: string;
  iconText: string;
}

interface RevenueMonth {
  month: string;
  value: number;
}

interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

interface Activity {
  text: string;
  time: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface Deadline {
  title: string;
  dueDate: string;
  status: 'on-track' | 'at-risk' | 'overdue';
}

interface TopDeal {
  name: string;
  amount: string;
  stage: string;
  stageColor: string;
}

/* ───────── Mock data ───────── */

const KPI_CARDS: KpiCard[] = [
  {
    label: 'Revenue (MTD)',
    value: '֏4,820,000',
    change: '+18.2% vs last month',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  {
    label: 'Active Projects',
    value: '24',
    change: '+3 this month',
    icon: FolderKanban,
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  {
    label: 'Open Deals',
    value: '12',
    change: '4 closing this week',
    icon: Handshake,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  {
    label: 'Pending Invoices',
    value: '8',
    change: '֏1.2M outstanding',
    icon: FileText,
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
  },
  {
    label: 'Active Tasks',
    value: '47',
    change: '8 due today',
    icon: CheckSquare,
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
  {
    label: 'Support Tickets',
    value: '5',
    change: '2 high priority',
    icon: Headphones,
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
  },
];

const REVENUE_MONTHS: RevenueMonth[] = [
  { month: 'Oct', value: 3200000 },
  { month: 'Nov', value: 3800000 },
  { month: 'Dec', value: 4100000 },
  { month: 'Jan', value: 3600000 },
  { month: 'Feb', value: 4400000 },
  { month: 'Mar', value: 4820000 },
];

const PIPELINE_STAGES: PipelineStage[] = [
  { label: 'Discovery', count: 18, color: 'bg-blue-500' },
  { label: 'Proposal', count: 12, color: 'bg-amber-500' },
  { label: 'Negotiation', count: 8, color: 'bg-orange-500' },
  { label: 'Closing', count: 4, color: 'bg-emerald-500' },
  { label: 'Won', count: 14, color: 'bg-green-600' },
];

const RECENT_ACTIVITIES: Activity[] = [
  { text: 'Invoice INV-2026-0234 paid — ֏320,000', time: '2 min ago', icon: DollarSign },
  { text: 'New lead from Instagram campaign', time: '15 min ago', icon: UserPlus },
  { text: 'Task "Design Landing" marked complete', time: '1h ago', icon: CheckSquare },
  { text: 'Support ticket #142 escalated to P2', time: '2h ago', icon: AlertTriangle },
  { text: 'Client feedback on TechCorp proposal', time: '3h ago', icon: MessageSquare },
];

const UPCOMING_DEADLINES: Deadline[] = [
  { title: 'TechCorp website delivery', dueDate: 'Mar 14', status: 'on-track' },
  { title: 'Q1 financial report', dueDate: 'Mar 15', status: 'at-risk' },
  { title: 'Invoice batch #47 due', dueDate: 'Mar 16', status: 'on-track' },
  { title: 'Client presentation — ArmenTech', dueDate: 'Mar 18', status: 'on-track' },
  { title: 'Server migration phase 2', dueDate: 'Mar 12', status: 'overdue' },
];

const TOP_DEALS: TopDeal[] = [
  {
    name: 'ArmenTech — ERP System',
    amount: '֏12,500,000',
    stage: 'Negotiation',
    stageColor: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'SkyNet — Mobile App',
    amount: '֏8,200,000',
    stage: 'Proposal',
    stageColor: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'GreenLine — Website',
    amount: '֏4,800,000',
    stage: 'Closing',
    stageColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'DigiPay — Integration',
    amount: '֏3,600,000',
    stage: 'Discovery',
    stageColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'CloudHost — Rebrand',
    amount: '֏2,400,000',
    stage: 'Proposal',
    stageColor: 'bg-amber-100 text-amber-700',
  },
];

/* ───────── Helpers ───────── */

const STATUS_STYLES: Record<Deadline['status'], string> = {
  'on-track': 'bg-emerald-100 text-emerald-700',
  'at-risk': 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<Deadline['status'], string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  overdue: 'Overdue',
};

/* ───────── Components ───────── */

function KpiCardItem({ card }: { card: KpiCard }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${card.iconBg} ${card.iconText}`}>
          <card.icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground" />
      </div>
      <div className="mt-4">
        <p className="text-foreground text-2xl font-semibold">{card.value}</p>
        <p className="text-muted-foreground mt-1 text-sm">{card.label}</p>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">{card.change}</p>
    </div>
  );
}

function RevenueChart() {
  const maxVal = Math.max(...REVENUE_MONTHS.map((m) => m.value));

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Revenue Trend</h2>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp size={14} />
          +18.2%
        </span>
      </div>
      <div className="mt-6 flex items-end gap-3" style={{ height: 180 }}>
        {REVENUE_MONTHS.map((m) => {
          const pct = (m.value / maxVal) * 100;
          return (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {(m.value / 1_000_000).toFixed(1)}M
              </span>
              <div
                className="bg-accent/80 w-full rounded-t-lg transition-all"
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

function PipelineFunnel() {
  const totalDeals = PIPELINE_STAGES.reduce((s, st) => s + st.count, 0);

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Deal Pipeline</h2>
        <span className="text-muted-foreground text-xs">{totalDeals} total deals</span>
      </div>
      <div className="mt-6 space-y-3">
        {PIPELINE_STAGES.map((stage) => {
          const pct = (stage.count / totalDeals) * 100;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="text-muted-foreground w-24 text-sm">{stage.label}</span>
              <div
                className="bg-secondary flex-1 overflow-hidden rounded-full"
                style={{ height: 10 }}
              >
                <div
                  className={`h-full rounded-full ${stage.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-foreground w-8 text-right text-sm font-medium">
                {stage.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentActivityList() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Recent Activity</h2>
      <div className="mt-4 space-y-4">
        {RECENT_ACTIVITIES.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="bg-secondary text-muted-foreground rounded-lg p-2">
              <a.icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm">{a.text}</p>
              <p className="text-muted-foreground text-xs">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingDeadlinesList() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <h2 className="text-foreground text-lg font-semibold">Upcoming Deadlines</h2>
      <div className="mt-4 space-y-3">
        {UPCOMING_DEADLINES.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm">{d.title}</p>
              <p className="text-muted-foreground text-xs">{d.dueDate}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[d.status]}`}
            >
              {STATUS_LABELS[d.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopDealsList() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex items-center gap-2">
        <Star size={18} className="text-accent" />
        <h2 className="text-foreground text-lg font-semibold">Top Deals</h2>
      </div>
      <div className="mt-4 space-y-3">
        {TOP_DEALS.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm">{d.name}</p>
              <p className="text-muted-foreground text-xs font-medium">{d.amount}</p>
            </div>
            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${d.stageColor}`}>
              {d.stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening across your business today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map((card) => (
          <KpiCardItem key={card.label} card={card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart />
        <PipelineFunnel />
      </div>

      {/* Bottom Lists Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentActivityList />
        <UpcomingDeadlinesList />
        <TopDealsList />
      </div>
    </div>
  );
}
