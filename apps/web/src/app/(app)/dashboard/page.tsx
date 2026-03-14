'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  FolderKanban,
  Handshake,
  FileText,
  CheckSquare,
  Headphones,
  ArrowUpRight,
  Star,
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
  pipelineStages: { label: string; count: number; color: string }[];
  recentTasks: { title: string; code: string; status: string; assignee: string }[];
  topDeals: { name: string; amount: number; stage: string }[];
}

const PIPELINE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-sky-500',
  QUALIFIED: 'bg-teal-500',
  PROPOSAL: 'bg-amber-500',
  NEGOTIATION: 'bg-orange-500',
  CLOSED_WON: 'bg-green-600',
  CLOSED_LOST: 'bg-red-500',
};

const STAGE_COLORS: Record<string, string> = {
  PROPOSAL: 'bg-amber-100 text-amber-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-sky-100 text-sky-700',
  QUALIFIED: 'bg-teal-100 text-teal-700',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'bg-gray-100 text-gray-700',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-violet-100 text-violet-700',
  DONE: 'bg-green-100 text-green-700',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `֏${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `֏${(n / 1_000).toFixed(0)}K`;
  return `֏${n}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, dealsRes, invoicesRes, tasksRes, ticketsRes, employeesRes] =
        await Promise.allSettled([
          api.get('/api/projects/stats'),
          api.get('/api/crm/deals', { params: { pageSize: 200 } }),
          api.get('/api/finance/invoices', { params: { pageSize: 200 } }),
          api.get('/api/tasks', { params: { pageSize: 200 } }),
          api.get('/api/support', { params: { pageSize: 200 } }),
          api.get('/api/employees'),
        ]);

      const projectsStats = projectsRes.status === 'fulfilled' ? projectsRes.value.data : null;
      const dealsData = dealsRes.status === 'fulfilled' ? dealsRes.value.data : null;
      const invoicesData = invoicesRes.status === 'fulfilled' ? invoicesRes.value.data : null;
      const tasksData = tasksRes.status === 'fulfilled' ? tasksRes.value.data : null;
      const ticketsData = ticketsRes.status === 'fulfilled' ? ticketsRes.value.data : null;
      const employeesData = employeesRes.status === 'fulfilled' ? employeesRes.value.data : null;

      const deals = dealsData?.items ?? dealsData ?? [];
      const invoices = invoicesData?.items ?? invoicesData ?? [];
      const tasks = tasksData?.items ?? tasksData ?? [];
      const tickets = ticketsData?.items ?? ticketsData ?? [];
      const employees = employeesData?.items ?? employeesData ?? [];

      const pendingInvoices = invoices.filter(
        (inv: { status: string }) => inv.status === 'WAITING' || inv.status === 'CREATE_INVOICE',
      );
      const pendingAmount = pendingInvoices.reduce(
        (sum: number, inv: { amount: string | number }) => sum + Number(inv.amount || 0),
        0,
      );

      const paidInvoices = invoices.filter((inv: { status: string }) => inv.status === 'PAID');
      const revenue = paidInvoices.reduce(
        (sum: number, inv: { amount: string | number }) => sum + Number(inv.amount || 0),
        0,
      );

      const openDeals = deals.filter(
        (d: { status: string }) => d.status !== 'CLOSED_WON' && d.status !== 'CLOSED_LOST',
      );

      const activeTasks = tasks.filter((t: { status: string }) => t.status !== 'DONE');
      const today = new Date().toISOString().split('T')[0];
      const dueTodayTasks = activeTasks.filter(
        (t: { dueDate: string | null }) => t.dueDate && t.dueDate.startsWith(today),
      );

      const openTickets = tickets.filter(
        (t: { status: string }) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      );
      const criticalTickets = openTickets.filter(
        (t: { priority: string }) => t.priority === 'CRITICAL',
      );

      const statusCounts: Record<string, number> = {};
      for (const d of deals) {
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      }
      const pipelineStages = Object.entries(statusCounts).map(([label, count]) => ({
        label,
        count,
        color: PIPELINE_COLORS[label] ?? 'bg-gray-500',
      }));

      const topDealsSorted = [...deals]
        .sort(
          (a: { amount: number | null }, b: { amount: number | null }) =>
            (Number(b.amount) || 0) - (Number(a.amount) || 0),
        )
        .slice(0, 5)
        .map(
          (d: {
            lead?: { contactName: string } | null;
            contact?: { firstName: string; lastName: string };
            code: string;
            amount: number | null;
            status: string;
          }) => ({
            name:
              (d.lead?.contactName ??
                `${d.contact?.firstName ?? ''} ${d.contact?.lastName ?? ''}`.trim()) ||
              d.code,
            amount: Number(d.amount) || 0,
            stage: d.status,
          }),
        );

      const recentTasks = [...tasks]
        .sort((a: { createdAt: string }, b: { createdAt: string }) =>
          b.createdAt.localeCompare(a.createdAt),
        )
        .slice(0, 5)
        .map(
          (t: {
            title: string;
            code: string;
            status: string;
            assignee?: { firstName: string; lastName: string } | null;
          }) => ({
            title: t.title,
            code: t.code,
            status: t.status,
            assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned',
          }),
        );

      setData({
        revenue: { mtd: revenue, change: 0 },
        activeProjects: projectsStats?.total ?? 0,
        openDeals: openDeals.length,
        pendingInvoices: { count: pendingInvoices.length, amount: pendingAmount },
        activeTasks: { total: activeTasks.length, dueToday: dueTodayTasks.length },
        openTickets: { total: openTickets.length, critical: criticalTickets.length },
        teamSize: employees.length,
        pipelineStages,
        topDeals: topDealsSorted,
        recentTasks,
      });
    } catch {
      /* fallback to null */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Could not load dashboard data</p>
        <Button onClick={fetchDashboard}>
          <RefreshCcw size={16} className="mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue (Paid)',
      value: formatCurrency(data.revenue.mtd),
      change: 'From paid invoices',
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconText: 'text-emerald-600',
    },
    {
      label: 'Active Projects',
      value: String(data.activeProjects),
      change: 'Total in system',
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
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users2 size={14} /> {data.teamSize} team members
          </span>
          <Button variant="outline" size="icon" onClick={fetchDashboard}>
            <RefreshCcw size={16} />
          </Button>
        </div>
      </div>

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
        {/* Deal Pipeline */}
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Deal Pipeline</h2>
            <span className="text-muted-foreground text-xs">{totalDeals} total deals</span>
          </div>
          {data.pipelineStages.length === 0 ? (
            <p className="text-muted-foreground mt-6 text-center text-sm">No deals yet</p>
          ) : (
            <div className="mt-6 space-y-3">
              {data.pipelineStages.map((stage) => {
                const pct = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
                return (
                  <div key={stage.label} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-28 truncate text-sm">
                      {stage.label}
                    </span>
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
          )}
        </div>

        {/* Top Deals */}
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            <h2 className="text-lg font-semibold">Top Deals</h2>
          </div>
          {data.topDeals.length === 0 ? (
            <p className="text-muted-foreground mt-6 text-center text-sm">No deals yet</p>
          ) : (
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
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
        </div>
        {data.recentTasks.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-center text-sm">No tasks yet</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.recentTasks.map((t, i) => (
              <div key={i} className="border-border rounded-xl border p-4">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">{t.code}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${TASK_STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {t.status}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">{t.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
