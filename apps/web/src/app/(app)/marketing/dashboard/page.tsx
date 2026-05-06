'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AreaChart, AlertTriangle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { marketingApi, type MarketingDashboardSummary } from '@/lib/api/marketing';
import { MarketingDashboardPeriodBar } from '@/features/marketing/components/MarketingDashboardPeriodBar';
import {
  getMarketingDashboardQueryRange,
  type MarketingDashboardPeriodPreset,
} from '@/features/marketing/constants/marketing-dashboard-period';

const MARKETING_CURRENCY = 'AMD';

export default function MarketingDashboardPage() {
  const [summary, setSummary] = useState<MarketingDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<MarketingDashboardPeriodPreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queryRange = useMemo(
    () => getMarketingDashboardQueryRange(periodPreset, { from: customFrom, to: customTo }),
    [periodPreset, customFrom, customTo],
  );

  const fetchDashboard = useCallback(async () => {
    if (periodPreset === 'custom' && !queryRange) {
      setError('Choose a valid custom date range (from and to).');
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSummary(await marketingApi.getDashboardSummary(queryRange));
      setError(null);
    } catch {
      setError('Marketing dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [periodPreset, queryRange]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Dashboard"
        description="Operational marketing snapshot with honest missing-data warnings."
      >
        <Button variant="outline" size="icon" onClick={() => void fetchDashboard()}>
          <RefreshCcw size={16} />
        </Button>
      </PageHeader>

      <MarketingDashboardPeriodBar
        preset={periodPreset}
        onPresetChange={setPeriodPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        summary={summary}
        disabled={loading}
      />

      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void fetchDashboard()} />
      ) : summary ? (
        <MarketingDashboardContent summary={summary} />
      ) : (
        <ErrorState
          description="Marketing dashboard returned no summary."
          onRetry={() => void fetchDashboard()}
        />
      )}
    </div>
  );
}

function MarketingDashboardContent({ summary }: { summary: MarketingDashboardSummary }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Activities" value={summary.totals.activities} />
        <MetricCard label="Launched now" value={summary.totals.launchedActivities} />
        <MetricCard
          label="Finance-linked activities"
          value={summary.totals.activitiesWithFinanceExpense}
        />
        <MetricCard label="Attributed leads" value={summary.totals.attributedLeads} />
        <MetricCard label="Attributed deals" value={summary.totals.attributedDeals} />
        <MetricCard label="Won attributed deals" value={summary.totals.wonAttributedDeals} />
        <MetricCard
          label="Paid attributed revenue"
          value={formatMoney(summary.money.paidRevenue)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendReadinessCard summary={summary} />
        <EfficiencyCard summary={summary} />
        <DataQualityCard summary={summary} />
      </div>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <AreaChart size={18} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function SpendReadinessCard({ summary }: { summary: MarketingDashboardSummary }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <AreaChart size={18} />
        Spend and revenue signals
      </h2>
      <div className="space-y-2 text-sm">
        <SummaryRow
          label="Planned budgets (activities)"
          value={formatMoney(summary.money.plannedSpend)}
        />
        <SummaryRow
          label="Paid marketing spend (Finance)"
          value={
            summary.money.roiMetricsAvailable
              ? formatMoney(summary.money.paidMarketingSpend)
              : 'No spend data'
          }
        />
        <SummaryRow
          label="Paid attributed revenue"
          value={formatMoney(summary.money.paidRevenue)}
        />
        <SummaryRow label="Missing finance links" value={summary.totals.missingFinanceLinks} />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        Paid marketing spend sums Finance expense payments for cards and plans linked from
        Marketing. Revenue uses real invoice payments on attributed deals.
        {summary.period
          ? ' For this period: leads (by creation), deals created in range, won deals with payments in range, revenue, and spend follow the applied dates. Planned budgets and missing Finance link counts stay workspace-wide.'
          : null}
      </p>
    </div>
  );
}

function EfficiencyCard({ summary }: { summary: MarketingDashboardSummary }) {
  if (!summary.money.roiMetricsAvailable) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <AreaChart size={18} />
          CPL / ROI snapshot
        </h2>
        <p className="text-muted-foreground text-sm">
          Cost metrics (CPL, ROAS, net return) are hidden until Finance records paid marketing spend
          on linked expense cards or expense plans.
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Planned budgets alone are not used as spend for ROI.
        </p>
      </div>
    );
  }

  if (!summary.efficiency.isReliable) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <AreaChart size={18} />
          CPL / ROI snapshot
        </h2>
        <p className="text-muted-foreground text-sm">
          {summary.efficiency.reason ??
            'ROI and CPL stay hidden until marketing spend coverage is complete in Finance.'}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Partial payment totals are not shown as CPL or ROI.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <AreaChart size={18} />
        CPL / ROI snapshot
      </h2>
      <div className="space-y-2 text-sm">
        <SummaryRow label="ROAS" value={formatRatio(summary.money.roas)} />
        <SummaryRow label="Net return" value={formatOptionalMoney(summary.money.netReturn)} />
        <SummaryRow
          label="Cost per attributed lead (CPL)"
          value={formatOptionalMoney(summary.money.costPerAttributedLead)}
        />
        <SummaryRow
          label="Cost per won attributed deal (CAC)"
          value={formatOptionalMoney(summary.money.costPerWonDeal)}
        />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        Metrics use paid marketing spend from Finance and paid attributed revenue.
      </p>
    </div>
  );
}

function DataQualityCard({ summary }: { summary: MarketingDashboardSummary }) {
  const hasWarnings = summary.warnings.length > 0;
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        {hasWarnings ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        Data quality
      </h2>
      {hasWarnings ? <WarningList warnings={summary.warnings} /> : <HealthyDataMessage />}
    </div>
  );
}

function WarningList({ warnings }: { warnings: MarketingDashboardSummary['warnings'] }) {
  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div key={warning.code} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">{warning.message}</p>
          <p className="text-xs text-amber-700">Affected records: {warning.count}</p>
        </div>
      ))}
    </div>
  );
}

function HealthyDataMessage() {
  return (
    <p className="text-muted-foreground text-sm">
      No missing Finance links detected for marketing accounts or paid activities.
    </p>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: MARKETING_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatOptionalMoney(value: number | null) {
  return value === null ? 'Not enough data' : formatMoney(value);
}

function formatRatio(value: number | null) {
  if (value === null) {
    return 'Not enough data';
  }

  return `${value.toFixed(2)}x`;
}
