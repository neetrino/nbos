'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  EyeOff,
  RefreshCcw,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/lib/api/dashboard';
import { usePermission } from '@/lib/permissions';
import { loadDashboardControlData } from './dashboard-control-data';
import {
  MINI_METRICS,
  PINNED_ACTIONS,
  priorityClass,
  type DashboardData,
  type DashboardPreference,
  type PinnedAction,
  type PriorityCard,
} from './dashboard-control-registry';

export function DashboardControlCenter() {
  const dashboard = useDashboardControlCenter();

  if (dashboard.loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Control Center"
        description="Pinned actions, priority feed and lightweight widgets for what needs attention now."
      >
        <Button variant="outline" onClick={() => void dashboard.fetchDashboard()}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </PageHeader>
      {dashboard.error ? <DashboardError message={dashboard.error} /> : null}
      <PinnedActions
        actions={dashboard.actions}
        onHideAction={dashboard.hidePinnedAction}
        onReset={dashboard.resetPreferences}
        saving={dashboard.savingPreference}
      />
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PriorityFeed priorities={dashboard.priorities} />
        <MiniAnalytics
          data={dashboard.data}
          hiddenWidgets={dashboard.preference?.hiddenWidgets ?? []}
          onHideWidget={dashboard.hideWidget}
          saving={dashboard.savingPreference}
        />
      </section>
    </div>
  );
}

function useDashboardControlCenter() {
  const { can } = usePermission();
  const [data, setData] = useState<DashboardData | null>(null);
  const [preference, setPreference] = useState<DashboardPreference | null>(null);
  const [priorities, setPriorities] = useState<PriorityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const actions = useMemo(() => applyActionPreferences(PINNED_ACTIONS, preference), [preference]);
  const permittedActions = useMemo(
    () => actions.filter((action) => can(action.action, action.module)),
    [actions, can],
  );
  const preferenceControls = usePreferenceControls(preference, setPreference);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projection = await loadDashboardControlData();
      setData(projection.metrics);
      setPreference(projection.preference);
      setPriorities(projection.priorities);
    } catch (caught) {
      setData(null);
      setPriorities([]);
      setError(caught instanceof Error ? caught.message : 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return {
    actions: permittedActions,
    data,
    error,
    fetchDashboard,
    loading,
    preference,
    priorities,
    ...preferenceControls,
  };
}

function usePreferenceControls(
  preference: DashboardPreference | null,
  setPreference: (preference: DashboardPreference) => void,
) {
  const [savingPreference, setSavingPreference] = useState(false);
  const savePreference = useCallback(
    async (payload: Partial<DashboardPreference>) => {
      setSavingPreference(true);
      try {
        setPreference(await dashboardApi.updatePreference(payload));
      } finally {
        setSavingPreference(false);
      }
    },
    [setPreference],
  );

  const hidePinnedAction = useCallback(
    (key: string) =>
      savePreference({
        hiddenPinnedActions: [...(preference?.hiddenPinnedActions ?? []), key],
      }),
    [preference, savePreference],
  );

  const hideWidget = useCallback(
    (key: string) =>
      savePreference({
        hiddenWidgets: [...(preference?.hiddenWidgets ?? []), key],
      }),
    [preference, savePreference],
  );

  const resetPreferences = useCallback(
    () =>
      savePreference({
        hiddenPinnedActions: [],
        hiddenWidgets: [],
        compactWidgets: [],
      }),
    [savePreference],
  );

  return { hidePinnedAction, hideWidget, resetPreferences, savingPreference };
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

function PinnedActions({
  actions,
  onHideAction,
  onReset,
  saving,
}: {
  actions: PinnedAction[];
  onHideAction: (key: string) => void;
  onReset: () => void;
  saving: boolean;
}) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-lg font-semibold">Pinned actions</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Creation and frequent work entry points live here, not as a global header button.
      </p>
      <Button className="mt-3" variant="outline" size="sm" onClick={onReset} disabled={saving}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset layout
      </Button>
      {actions.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No pinned actions are available for your current permissions.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <PinnedActionCard
              key={action.href}
              action={action}
              onHide={() => onHideAction(action.key)}
              saving={saving}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PinnedActionCard({
  action,
  onHide,
  saving,
}: {
  action: PinnedAction;
  onHide: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-border hover:bg-muted/50 rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link href={action.href} className="bg-primary/10 text-primary rounded-xl p-2.5">
          <action.icon size={18} />
        </Link>
        <Button variant="ghost" size="icon" onClick={onHide} disabled={saving}>
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
      <Link href={action.href} className="mt-3 flex items-center gap-1 font-medium">
        {action.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
      <p className="text-muted-foreground mt-1 text-sm">{action.description}</p>
    </div>
  );
}

function PriorityFeed({ priorities }: { priorities: PriorityCard[] }) {
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

function MiniAnalytics({
  data,
  hiddenWidgets,
  onHideWidget,
  saving,
}: {
  data: DashboardData | null;
  hiddenWidgets: string[];
  onHideWidget: (key: string) => void;
  saving: boolean;
}) {
  const metrics = MINI_METRICS.filter((metric) => !hiddenWidgets.includes(metric.id));
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-600" />
        <h2 className="text-lg font-semibold">Mini analytics</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {metrics.map((metric) => (
          <MiniMetric
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={'key' in metric ? (data?.[metric.key] ?? 0) : metric.value}
            href={'href' in metric ? metric.href : undefined}
            onHide={() => onHideWidget(metric.id)}
            saving={saving}
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
  onHide,
  saving,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  href?: string;
  onHide: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-border flex items-center justify-between rounded-xl border p-3">
      {href ? (
        <Link href={href} className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{label}</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{label}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        <Button variant="ghost" size="icon" onClick={onHide} disabled={saving}>
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function applyActionPreferences(
  actions: PinnedAction[],
  preference: DashboardPreference | null,
): PinnedAction[] {
  const hidden = new Set(preference?.hiddenPinnedActions ?? []);
  const byKey = new Map<string, PinnedAction>(actions.map((action) => [action.key, action]));
  const ordered = (preference?.pinnedActionOrder ?? []).flatMap((key) => {
    const action = byKey.get(key);
    return action && !hidden.has(action.key) ? [action] : [];
  });
  const orderedKeys = new Set(ordered.map((action) => action.key));
  const rest = actions.filter((action) => !orderedKeys.has(action.key) && !hidden.has(action.key));
  return [...ordered, ...rest];
}
