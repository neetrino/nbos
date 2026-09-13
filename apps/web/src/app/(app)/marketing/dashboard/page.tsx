'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AreaChart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ErrorState, LoadingState, useModuleHeroSlots } from '@/components/shared';
import { marketingApi, type MarketingDashboardSummary } from '@/lib/api/marketing';
import { MarketingDashboardHeroSearch } from '@/features/marketing/components/MarketingDashboardHeroSearch';
import {
  getMarketingDashboardQueryRange,
  type MarketingDashboardPeriodPreset,
} from '@/features/marketing/constants/marketing-dashboard-period';
import { matchesMarketingSearch } from '@/features/marketing/utils/matches-marketing-search';
import type { MarketingTranslate } from '@/features/marketing/i18n/marketing-copy';
import { AMD_CURRENCY_SYMBOL, formatGroupedNumber, formatMoneyDram } from '@/lib/format/money';

export default function MarketingDashboardPage() {
  const t = useTranslations('marketing');
  const [summary, setSummary] = useState<MarketingDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<MarketingDashboardPeriodPreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');

  const queryRange = useMemo(
    () => getMarketingDashboardQueryRange(periodPreset, { from: customFrom, to: customTo }),
    [periodPreset, customFrom, customTo],
  );

  const fetchDashboard = useCallback(async () => {
    if (periodPreset === 'custom' && !queryRange) {
      setError(t('dashboard.customRangeError'));
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSummary(await marketingApi.getDashboardSummary(queryRange));
      setError(null);
    } catch {
      setError(t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [periodPreset, queryRange, t]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <MarketingDashboardHeroSearch
          search={search}
          onSearchChange={setSearch}
          preset={periodPreset}
          onPresetChange={setPeriodPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          summary={summary}
          disabled={loading}
        />
      ),
    }),
    [customFrom, customTo, loading, periodPreset, search, summary],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void fetchDashboard()} />
      ) : summary ? (
        <MarketingDashboardContent summary={summary} search={search} t={t} />
      ) : (
        <ErrorState description={t('dashboard.noSummary')} onRetry={() => void fetchDashboard()} />
      )}
    </div>
  );
}

function MarketingDashboardContent({
  summary,
  search,
  t,
}: {
  summary: MarketingDashboardSummary;
  search: string;
  t: MarketingTranslate;
}) {
  const metrics: Array<{ label: string; value: number | string; money?: boolean }> = [
    { label: t('dashboard.metrics.activities'), value: summary.totals.activities },
    { label: t('dashboard.metrics.launchedNow'), value: summary.totals.launchedActivities },
    {
      label: t('dashboard.metrics.financeLinked'),
      value: summary.totals.activitiesWithFinanceExpense,
    },
    { label: t('dashboard.metrics.attributedLeads'), value: summary.totals.attributedLeads },
    { label: t('dashboard.metrics.attributedDeals'), value: summary.totals.attributedDeals },
    { label: t('dashboard.metrics.wonAttributedDeals'), value: summary.totals.wonAttributedDeals },
    {
      label: t('dashboard.metrics.paidAttributedRevenue'),
      value: summary.money.paidRevenue,
      money: true,
    },
  ].filter((metric) => matchesMarketingSearch(search, metric.label));

  const spendTitle = t('dashboard.spend.title');
  const efficiencyTitle = t('dashboard.efficiency.title');
  const qualityTitle = t('dashboard.quality.title');
  const showSpend = matchesMarketingSearch(search, spendTitle, 'spend', 'revenue');
  const showEfficiency = matchesMarketingSearch(
    search,
    efficiencyTitle,
    'CPL',
    'ROI',
    'ROAS',
    'CAC',
    'efficiency',
  );
  const showQuality = matchesMarketingSearch(search, qualityTitle, 'warnings', 'finance');

  return (
    <>
      {metrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              money={metric.money}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {showSpend ? <SpendReadinessCard summary={summary} t={t} /> : null}
        {showEfficiency ? <EfficiencyCard summary={summary} t={t} /> : null}
        {showQuality ? <DataQualityCard summary={summary} t={t} /> : null}
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  money = false,
}: {
  label: string;
  value: number | string;
  money?: boolean;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <AreaChart size={18} aria-hidden />
        </div>
        <p className="text-muted-foreground text-sm leading-snug">{label}</p>
      </div>
      <p className="text-3xl font-bold tabular-nums">
        {money && typeof value === 'number' ? (
          <>
            {formatGroupedNumber(value)}
            <span className="text-muted-foreground ml-1.5 text-2xl font-semibold" aria-hidden>
              {AMD_CURRENCY_SYMBOL}
            </span>
            <span className="sr-only"> AMD</span>
          </>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function SpendReadinessCard({
  summary,
  t,
}: {
  summary: MarketingDashboardSummary;
  t: MarketingTranslate;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <AreaChart size={18} />
        {t('dashboard.spend.title')}
      </h2>
      <div className="space-y-2 text-sm">
        <SummaryRow
          label={t('dashboard.spend.plannedBudgets')}
          value={formatMoney(summary.money.plannedSpend)}
        />
        <SummaryRow
          label={t('dashboard.spend.paidMarketingSpend')}
          value={
            summary.money.roiMetricsAvailable
              ? formatMoney(summary.money.paidMarketingSpend)
              : t('dashboard.spend.noSpendData')
          }
        />
        <SummaryRow
          label={t('dashboard.spend.paidAttributedRevenue')}
          value={formatMoney(summary.money.paidRevenue)}
        />
        <SummaryRow
          label={t('dashboard.spend.missingFinanceLinks')}
          value={summary.totals.missingFinanceLinks}
        />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        {t('dashboard.spend.footnote')}
        {summary.period ? t('dashboard.spend.footnotePeriod') : null}
      </p>
    </div>
  );
}

function EfficiencyCard({
  summary,
  t,
}: {
  summary: MarketingDashboardSummary;
  t: MarketingTranslate;
}) {
  if (!summary.money.roiMetricsAvailable) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <AreaChart size={18} />
          {t('dashboard.efficiency.title')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('dashboard.efficiency.hiddenUntilSpend')}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          {t('dashboard.efficiency.plannedBudgetsNote')}
        </p>
      </div>
    );
  }

  if (!summary.efficiency.isReliable) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <AreaChart size={18} />
          {t('dashboard.efficiency.title')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {summary.efficiency.reason ?? t('dashboard.efficiency.hiddenUntilSpend')}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          {t('dashboard.efficiency.partialPaymentsNote')}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <AreaChart size={18} />
        {t('dashboard.efficiency.title')}
      </h2>
      <div className="space-y-2 text-sm">
        <SummaryRow
          label={t('dashboard.efficiency.roas')}
          value={formatRatio(summary.money.roas, t)}
        />
        <SummaryRow
          label={t('dashboard.efficiency.netReturn')}
          value={formatOptionalMoney(summary.money.netReturn, t)}
        />
        <SummaryRow
          label={t('dashboard.efficiency.cpl')}
          value={formatOptionalMoney(summary.money.costPerAttributedLead, t)}
        />
        <SummaryRow
          label={t('dashboard.efficiency.cac')}
          value={formatOptionalMoney(summary.money.costPerWonDeal, t)}
        />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        {t('dashboard.efficiency.metricsFootnote')}
      </p>
    </div>
  );
}

function DataQualityCard({
  summary,
  t,
}: {
  summary: MarketingDashboardSummary;
  t: MarketingTranslate;
}) {
  const hasWarnings = summary.warnings.length > 0;
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        {hasWarnings ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        {t('dashboard.quality.title')}
      </h2>
      {hasWarnings ? (
        <WarningList warnings={summary.warnings} t={t} />
      ) : (
        <HealthyDataMessage t={t} />
      )}
    </div>
  );
}

function WarningList({
  warnings,
  t,
}: {
  warnings: MarketingDashboardSummary['warnings'];
  t: MarketingTranslate;
}) {
  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div key={warning.code} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">{warning.message}</p>
          <p className="text-xs text-amber-700">
            {t('dashboard.quality.affectedRecords', { count: warning.count })}
          </p>
        </div>
      ))}
    </div>
  );
}

function HealthyDataMessage({ t }: { t: MarketingTranslate }) {
  return <p className="text-muted-foreground text-sm">{t('dashboard.quality.healthy')}</p>;
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
  return formatMoneyDram(value);
}

function formatOptionalMoney(value: number | null, t: MarketingTranslate) {
  return value === null ? t('dashboard.notEnoughData') : formatMoneyDram(value);
}

function formatRatio(value: number | null, t: MarketingTranslate) {
  if (value === null) {
    return t('dashboard.notEnoughData');
  }

  return `${value.toFixed(2)}x`;
}
