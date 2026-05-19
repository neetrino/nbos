'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Wallet, Timer } from 'lucide-react';
import { PageHero, StatusBadge } from '@/components/shared';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import { dashboardApi, type DashboardControlCenterProjection } from '@/lib/api/dashboard';

type KpiGateRow = {
  label: string;
  threshold: string;
  payout: string;
  variant: StatusVariant;
};

const KPI_GATE_TABLE: KpiGateRow[] = [
  { label: 'Strong delivery', threshold: '>= 70%', payout: '100%', variant: 'green' },
  { label: 'Warning zone', threshold: '50% - 69%', payout: '50%', variant: 'amber' },
  { label: 'Failed gate', threshold: '< 50%', payout: '0%', variant: 'red' },
];

export default function KpiPage() {
  const [control, setControl] = useState<DashboardControlCenterProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setControl(await dashboardApi.getControlCenter());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = control?.metrics;
  const priorityCount = useMemo(
    () => control?.priorities.length ?? 0,
    [control?.priorities.length],
  );

  return (
    <div className="space-y-6">
      <PageHero title="KPI / Scorecard" />
      <p className="text-muted-foreground text-sm">
        Company KPI runtime: cross-module signals, scorecard gate policy, and links to execution
        modules.
      </p>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <Target size={16} />
            Open tasks
          </div>
          <p className="text-foreground text-2xl font-semibold">{metrics?.openTasks ?? '—'}</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <TrendingUp size={16} />
            Open deals
          </div>
          <p className="text-foreground text-2xl font-semibold">{metrics?.openDeals ?? '—'}</p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <Wallet size={16} />
            Pending invoices
          </div>
          <p className="text-foreground text-2xl font-semibold">
            {metrics?.pendingInvoices ?? '—'}
          </p>
        </div>
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <Timer size={16} />
            Priority alerts
          </div>
          <p className="text-foreground text-2xl font-semibold">{priorityCount}</p>
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">KPI Gate Policy</h2>
          {loading ? <span className="text-muted-foreground text-xs">Loading metrics…</span> : null}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {KPI_GATE_TABLE.map((row) => (
            <div key={row.label} className="border-border rounded-xl border p-3">
              <div className="mb-2">
                <StatusBadge label={row.label} variant={row.variant} />
              </div>
              <p className="text-foreground text-sm font-medium">{row.threshold}</p>
              <p className="text-muted-foreground text-xs">Bonus payout: {row.payout}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-4">
        <h2 className="mb-2 text-sm font-semibold">Scorecard Module Links</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Dashboard Control Center
          </Link>
          <Link
            href="/reports"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Reports Catalog
          </Link>
          <Link
            href="/finance/payroll"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Payroll KPI Gate Impact
          </Link>
          <Link
            href="/tasks"
            className="border-border hover:bg-muted rounded-lg border px-3 py-1.5"
          >
            Tasks SLA / Throughput
          </Link>
        </div>
      </div>
    </div>
  );
}
