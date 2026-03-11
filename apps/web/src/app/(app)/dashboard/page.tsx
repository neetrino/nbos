'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Users2,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface DashboardData {
  revenue: { mtd: number; change: number };
  activeProjects: number;
  openDeals: number;
  pendingInvoices: { count: number; amount: number };
  activeTasks: { total: number; dueToday: number };
  openTickets: { total: number; critical: number };
  teamSize: number;
  revenueMonths: { month: string; value: number }[];
  pipelineStages: { label: string; count: number; color: string }[];
  recentActivity: { text: string; time: string; type: string }[];
  upcomingDeadlines: {
    title: string;
    dueDate: string;
    status: 'on-track' | 'at-risk' | 'overdue';
  }[];
  topDeals: { name: string; amount: number; stage: string }[];
}

const FALLBACK: DashboardData = {
  revenue: { mtd: 4820000, change: 18.2 },
  activeProjects: 24,
  openDeals: 12,
  pendingInvoices: { count: 8, amount: 1200000 },
  activeTasks: { total: 47, dueToday: 8 },
  openTickets: { total: 5, critical: 2 },
  teamSize: 14,
  revenueMonths: [
    { month: 'Oct', value: 3200000 },
    { month: 'Nov', value: 3800000 },
    { month: 'Dec', value: 4100000 },
    { month: 'Jan', value: 3600000 },
    { month: 'Feb', value: 4400000 },
    { month: 'Mar', value: 4820000 },
  ],
  pipelineStages: [
    { label: 'Discovery', count: 18, color: 'bg-blue-500' },
    { label: 'Proposal', count: 12, color: 'bg-amber-500' },
    { label: 'Negotiation', count: 8, color: 'bg-orange-500' },
    { label: 'Closing', count: 4, color: 'bg-emerald-500' },
    { label: 'Won', count: 14, color: 'bg-green-600' },
  ],
  recentActivity: [
    { text: 'Invoice INV-2026-0234 paid — ֏320,000', time: '2 min ago', type: 'payment' },
    { text: 'New lead from Instagram campaign', time: '15 min ago', type: 'lead' },
    { text: 'Task "Design Landing" marked complete', time: '1h ago', type: 'task' },
    { text: 'Support ticket #142 escalated to P2', time: '2h ago', type: 'ticket' },
    { text: 'Client feedback on TechCorp proposal', time: '3h ago', type: 'message' },
  ],
  upcomingDeadlines: [
    { title: 'TechCorp website delivery', dueDate: 'Mar 14', status: 'on-track' },
    { title: 'Q1 financial report', dueDate: 'Mar 15', status: 'at-risk' },
    { title: 'Invoice batch #47 due', dueDate: 'Mar 16', status: 'on-track' },
    { title: 'Client presentation — ArmenTech', dueDate: 'Mar 18', status: 'on-track' },
    { title: 'Server migration phase 2', dueDate: 'Mar 12', status: 'overdue' },
  ],
  topDeals: [
    { name: 'ArmenTech — ERP System', amount: 12500000, stage: 'Negotiation' },
    { name: 'SkyNet — Mobile App', amount: 8200000, stage: 'Proposal' },
    { name: 'GreenLine — Website', amount: 4800000, stage: 'Closing' },
    { name: 'DigiPay — Integration', amount: 3600000, stage: 'Discovery' },
    { name: 'CloudHost — Rebrand', amount: 2400000, stage: 'Proposal' },
  ],
};

const ACTIVITY_ICONS: Record<string, typeof DollarSign> = {
  payment: DollarSign,
  lead: UserPlus,
  task: CheckSquare,
  ticket: AlertTriangle,
  message: MessageSquare,
};

const STAGE_COLORS: Record<string, string> = {
  Discovery: 'bg-blue-100 text-blue-700',
  Proposal: 'bg-amber-100 text-amber-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Closing: 'bg-emerald-100 text-emerald-700',
  Won: 'bg-green-100 text-green-700',
};

const STATUS_STYLES: Record<string, string> = {
  'on-track': 'bg-emerald-100 text-emerald-700',
  'at-risk': 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  overdue: 'Overdue',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `֏${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `֏${(n / 1_000).toFixed(0)}K`;
  return `֏${n}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/dashboard');
      if (resp.data) setData({ ...FALLBACK, ...resp.data });
    } catch {
      /* use fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const kpiCards = [
    {
      label: 'Revenue (MTD)',
      value: formatCurrency(data.revenue.mtd),
      change: `${data.revenue.change > 0 ? '+' : ''}${data.revenue.change}% vs last month`,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconText: 'text-emerald-600',
    },
    {
      label: 'Active Projects',
      value: String(data.activeProjects),
      change: 'Across all stages',
      icon: FolderKanban,
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-600',
    },
    {
      label: 'Open Deals',
      value: String(data.openDeals),
      change: 'In pipeline',
      icon: Handshake,
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-600',
    },
    {
      label: 'Pending Invoices',
      value: String(data.pendingInvoices.count),
      change: `${formatCurrency(data.pendingInvoices.amount)} outstanding`,
      icon: FileText,
      iconBg: 'bg-orange-500/10',
      iconText: 'text-orange-600',
    },
    {
      label: 'Active Tasks',
      value: String(data.activeTasks.total),
      change: `${data.activeTasks.dueToday} due today`,
      icon: CheckSquare,
      iconBg: 'bg-violet-500/10',
      iconText: 'text-violet-600',
    },
    {
      label: 'Support Tickets',
      value: String(data.openTickets.total),
      change: `${data.openTickets.critical} critical`,
      icon: Headphones,
      iconBg: 'bg-red-500/10',
      iconText: 'text-red-600',
    },
  ];

  const maxRevenue = Math.max(...data.revenueMonths.map((m) => m.value));
  const totalDeals = data.pipelineStages.reduce((s, st) => s + st.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s what&apos;s happening across your business today.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchDashboard}>
          <RefreshCcw size={16} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="border-border bg-card rounded-2xl border p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ${card.iconBg} ${card.iconText}`}>
                    <card.icon size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold">{card.value}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{card.label}</p>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">{card.change}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Revenue Trend</h2>
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp size={14} />+{data.revenue.change}%
                </span>
              </div>
              <div className="mt-6 flex items-end gap-3" style={{ height: 180 }}>
                {data.revenueMonths.map((m) => {
                  const pct = (m.value / maxRevenue) * 100;
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

            {/* Deal Pipeline */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Deal Pipeline</h2>
                <span className="text-muted-foreground text-xs">{totalDeals} total deals</span>
              </div>
              <div className="mt-6 space-y-3">
                {data.pipelineStages.map((stage) => {
                  const pct = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
                  return (
                    <div key={stage.label} className="flex items-center gap-3">
                      <span className="text-muted-foreground w-24 text-sm">{stage.label}</span>
                      <div className="bg-secondary h-2.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-medium">{stage.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </div>
              <div className="mt-4 space-y-4">
                {data.recentActivity.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? MessageSquare;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="bg-secondary text-muted-foreground rounded-lg p-2">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{a.text}</p>
                        <p className="text-muted-foreground text-xs">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.upcomingDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{d.title}</p>
                      <p className="text-muted-foreground text-xs">{d.dueDate}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[d.status] ?? ''}`}
                    >
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Deals */}
            <div className="border-border bg-card rounded-2xl border p-6">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-accent" />
                <h2 className="text-lg font-semibold">Top Deals</h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.topDeals.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{d.name}</p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {formatCurrency(d.amount)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${STAGE_COLORS[d.stage] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {d.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
