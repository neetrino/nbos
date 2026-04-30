'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, BarChart3, RefreshCcw } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/lib/permissions';
import { buildPriorityCards, loadDashboardControlData } from './dashboard-control-data';
import {
  MINI_METRICS,
  PINNED_ACTIONS,
  priorityClass,
  type DashboardData,
  type PinnedAction,
} from './dashboard-control-registry';

export function DashboardControlCenter() {
  const { can } = usePermission();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const actions = useMemo(
    () => PINNED_ACTIONS.filter((action) => can(action.action, action.module)),
    [can],
  );
  const priorities = useMemo(() => buildPriorityCards(data), [data]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadDashboardControlData());
    } catch (caught) {
      setData(null);
      setError(caught instanceof Error ? caught.message : 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Control Center"
        description="Pinned actions, priority feed and lightweight widgets for what needs attention now."
      >
        <Button variant="outline" onClick={() => void fetchDashboard()}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </PageHeader>
      {error ? <DashboardError message={error} /> : null}
      <PinnedActions actions={actions} />
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PriorityFeed priorities={priorities} />
        <MiniAnalytics data={data} />
      </section>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {message}
    </div>
  );
}

function PinnedActions({ actions }: { actions: PinnedAction[] }) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-lg font-semibold">Pinned actions</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Creation and frequent work entry points live here, not as a global header button.
      </p>
      {actions.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No pinned actions are available for your current permissions.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <PinnedActionCard key={action.href} action={action} />
          ))}
        </div>
      )}
    </section>
  );
}

function PinnedActionCard({ action }: { action: PinnedAction }) {
  return (
    <Link
      href={action.href}
      className="border-border hover:bg-muted/50 rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="bg-primary/10 text-primary rounded-xl p-2.5">
          <action.icon size={18} />
        </div>
        <ArrowUpRight className="text-muted-foreground h-4 w-4" />
      </div>
      <p className="mt-3 font-medium">{action.label}</p>
      <p className="text-muted-foreground mt-1 text-sm">{action.description}</p>
    </Link>
  );
}

function PriorityFeed({ priorities }: { priorities: ReturnType<typeof buildPriorityCards> }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold">Priority feed</h2>
      </div>
      {priorities.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Nothing critical is waiting in the current lightweight feed.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {priorities.map((priority) => (
            <Link
              key={`${priority.source}:${priority.title}`}
              href={priority.href}
              className={`block rounded-xl border p-4 ${priorityClass(priority.severity)}`}
            >
              <p className="font-medium">{priority.title}</p>
              <p className="mt-1 text-sm opacity-80">{priority.context}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniAnalytics({ data }: { data: DashboardData | null }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-600" />
        <h2 className="text-lg font-semibold">Mini analytics</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {MINI_METRICS.map((metric) => (
          <MiniMetric
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={'key' in metric ? (data?.[metric.key] ?? 0) : metric.value}
            href={'href' in metric ? metric.href : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="border-border flex items-center justify-between rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
