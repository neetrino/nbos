'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { ErrorState, useModuleHeroSlots } from '@/components/shared';
import {
  getFinancePeriodParams,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';
import {
  DashboardLoadingSkeleton,
  ExpenseCardsSnapshot,
  FinanceNotes,
  InvoiceDistribution,
  KpiCards,
  PayrollRunsSnapshot,
  RecentPayments,
  ReconciliationSnapshot,
  UpcomingInvoices,
} from '@/features/finance/components/dashboard/FinanceDashboardSections';
import { FinanceZoneHubCards } from '@/features/finance/components/dashboard/FinanceZoneHubCards';
import { buildFinanceZoneHubMetrics } from '@/features/finance/components/dashboard/build-finance-zone-hub-metrics';
import {
  buildFinanceDashboardData,
  type FinanceDashboardData,
  type FinanceKpi,
} from '@/features/finance/components/dashboard/finance-dashboard-data';
import { buildFinanceOverviewHeroSearch } from '@/features/finance/components/overview/build-finance-overview-hero-search';
import { FinanceOverviewPageSettingsSheet } from '@/features/finance/components/overview/FinanceOverviewPageSettingsSheet';
import { financeDashboardPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { downloadFinanceDashboardCsv } from '@/features/finance/utils/export-finance-dashboard-csv';
import { financeSummaryApi } from '@/lib/api/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

export default function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useFinanceDocumentTitle(financeDashboardPageTitle());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const summary = await financeSummaryApi.getDashboard(getFinancePeriodParams(period));
      setData(buildFinanceDashboardData(summary));
    } catch (caught) {
      setData(null);
      setLoadError(
        getApiErrorMessage(
          caught,
          'Could not load finance dashboard data. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setPeriod('month');
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      search: buildFinanceOverviewHeroSearch({
        search,
        onSearchChange: setSearch,
        searchPlaceholder: 'Search KPIs, sections, notes…',
        period,
        onPeriodChange: setPeriod,
        onClearAll: handleClearFilters,
      }),
      trailing: (
        <FinanceOverviewPageSettingsSheet
          title="Finance overview — settings"
          description="Refresh dashboard data or export a CSV snapshot for the selected period."
          triggerAriaLabel="Finance overview settings"
          refreshDisabled={loading}
          onRefresh={() => void fetchDashboard()}
          onExportCsv={() => {
            if (!data) return;
            downloadFinanceDashboardCsv(data, period);
            toast.success('Finance dashboard snapshot exported');
          }}
          exportCsvDisabled={loading || !data}
          exportCsvLabel="Export dashboard (CSV)"
        />
      ),
    }),
    [data, fetchDashboard, handleClearFilters, loading, period, search],
  );

  useModuleHeroSlots(moduleHeroSlots);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!data) {
    return (
      <ErrorState
        title="Finance dashboard unavailable"
        description={
          loadError ?? 'Could not load finance dashboard data. Check your connection and try again.'
        }
        actionLabel="Retry"
        onRetry={fetchDashboard}
      />
    );
  }

  const query = search.trim().toLowerCase();
  const zoneHubMetrics = buildFinanceZoneHubMetrics(data);

  return (
    <div className="space-y-6">
      {showDashboardKpis(query) ? <KpiCards kpis={buildKpis(data)} /> : null}

      {matchesOverviewSearch('Finance zones', query) ? (
        <FinanceZoneHubCards metrics={zoneHubMetrics} />
      ) : null}

      {matchesOverviewSearch('Payroll runs', query) ? (
        <PayrollRunsSnapshot payroll={data.payrollRuns} />
      ) : null}

      {matchesOverviewSearch('Expense cards', query) ? (
        <ExpenseCardsSnapshot buckets={data.expenseBuckets} />
      ) : null}

      {matchesOverviewSearch('Invoice distribution', query) ||
      matchesOverviewSearch('Recent payments', query) ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {matchesOverviewSearch('Invoice distribution', query) ? (
            <InvoiceDistribution items={data.invoiceStatusItems} />
          ) : null}
          {matchesOverviewSearch('Recent payments', query) ? (
            <RecentPayments items={data.recentPayments} />
          ) : null}
        </div>
      ) : null}

      {matchesOverviewSearch('Reconciliation', query) ||
      matchesOverviewSearch('Upcoming invoices', query) ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {matchesOverviewSearch('Reconciliation', query) ? (
            <ReconciliationSnapshot data={data} />
          ) : null}
          {matchesOverviewSearch('Upcoming invoices', query) ? (
            <UpcomingInvoices items={data.upcomingInvoices} />
          ) : null}
        </div>
      ) : null}

      {matchesOverviewSearch('Notes', query) ? <FinanceNotes /> : null}

      {query && !hasAnyOverviewSectionMatch(query) ? (
        <p className="text-muted-foreground text-sm">
          No dashboard sections match your search. Clear search or filters to see all blocks.
        </p>
      ) : null}
    </div>
  );
}

function matchesOverviewSearch(sectionLabel: string, query: string): boolean {
  if (!query) return true;
  return sectionLabel.toLowerCase().includes(query);
}

function showDashboardKpis(query: string): boolean {
  if (!query) return true;
  const kpiLabels = ['Total Revenue', 'Outstanding', 'Overdue', 'MRR', 'KPI'];
  return kpiLabels.some((label) => label.toLowerCase().includes(query));
}

function hasAnyOverviewSectionMatch(query: string): boolean {
  const labels = [
    'KPI summary',
    'Finance zones',
    'Payroll runs',
    'Expense cards',
    'Invoice distribution',
    'Recent payments',
    'Reconciliation',
    'Upcoming invoices',
    'Notes',
  ];
  return showDashboardKpis(query) || labels.some((label) => matchesOverviewSearch(label, query));
}

function buildKpis(data: FinanceDashboardData): FinanceKpi[] {
  return [
    {
      label: 'Total Revenue',
      value: formatAmount(data.totalRevenue),
      change: 'From paid invoices',
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
    },
    {
      label: 'Outstanding',
      value: formatAmount(data.outstandingAmount),
      change: 'All unpaid invoices',
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: formatAmount(data.overdueAmount),
      change: 'Invoices in delayed state',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    {
      label: 'MRR',
      value: formatAmount(data.monthlyRecurringRevenue),
      change: 'Active subscriptions only',
      icon: RefreshCw,
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
    },
  ];
}
