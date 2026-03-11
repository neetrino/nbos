import {
  FolderKanban,
  Users,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

const STATS = [
  {
    label: 'Active Projects',
    value: '24',
    change: '+3 this month',
    icon: FolderKanban,
    color: 'bg-accent/10 text-accent',
  },
  {
    label: 'Open Deals',
    value: '12',
    change: '4 closing soon',
    icon: Users,
    color: 'bg-primary/5 text-primary',
  },
  {
    label: 'Revenue (MTD)',
    value: '2.4M AMD',
    change: '+18% vs last month',
    icon: DollarSign,
    color: 'bg-success/10 text-success',
  },
  {
    label: 'Pending Tasks',
    value: '47',
    change: '8 overdue',
    icon: CheckSquare,
    color: 'bg-warning/10 text-warning',
  },
] as const;

const RECENT_ACTIVITIES = [
  { text: 'Invoice INV-2026-0234 paid', time: '2 min ago', icon: DollarSign },
  { text: 'New lead from Instagram', time: '15 min ago', icon: TrendingUp },
  { text: 'Task "Design Landing" completed', time: '1 hour ago', icon: CheckSquare },
  { text: 'Support ticket P2 assigned', time: '2 hours ago', icon: AlertTriangle },
  { text: 'Project "TechCorp" deadline approaching', time: '3 hours ago', icon: Clock },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          <div className="mt-4 space-y-4">
            {RECENT_ACTIVITIES.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                  <activity.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            {[
              { label: 'New Lead', href: '/crm/leads' },
              { label: 'Create Invoice', href: '/finance/invoices' },
              { label: 'Add Task', href: '/tasks' },
              { label: 'New Project', href: '/projects' },
              { label: 'Support Ticket', href: '/support' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span>{action.label}</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
