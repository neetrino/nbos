'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BarChart3 } from 'lucide-react';
import { ErrorState, LoadingState, useModuleHeroSlots } from '@/components/shared';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import {
  financeReportStatusClass,
  financeReportStatusLabel,
} from '@/features/finance/constants/finance-report-status';
import {
  CashFlowSnapshot,
  CompanyPnlSnapshot,
  ExpensePlanVsActualSnapshot,
  MrrSubscriptionRevenueSnapshot,
  PayrollReportSnapshot,
  ProjectPnlSnapshot,
} from '@/features/finance/components/reports/FinanceReportSnapshots';
import { buildFinanceOverviewHeroSearch } from '@/features/finance/components/overview/build-finance-overview-hero-search';
import { FinanceOverviewPageSettingsSheet } from '@/features/finance/components/overview/FinanceOverviewPageSettingsSheet';
import { financeReportsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  financeReportsApi,
  type CashFlowReport,
  type CompanyPnlReport,
  type ExpensePlanVsActualReport,
  type FinanceReportDefinition,
  type FinanceReportDefinitionsResponse,
  type FinanceReportQueryParams,
  type MrrSubscriptionRevenueReport,
  type PayrollReport,
  type ProjectPnlReport,
} from '@/lib/api/finance-reports';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function FinanceReportsPage() {
  useFinanceDocumentTitle(financeReportsPageTitle());

  const [data, setData] = useState<FinanceReportDefinitionsResponse | null>(null);
  const [companyPnl, setCompanyPnl] = useState<CompanyPnlReport | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport | null>(null);
  const [expensePlanVsActual, setExpensePlanVsActual] = useState<ExpensePlanVsActualReport | null>(
    null,
  );
  const [mrrSubscriptionRevenue, setMrrSubscriptionRevenue] =
    useState<MrrSubscriptionRevenueReport | null>(null);
  const [payrollReport, setPayrollReport] = useState<PayrollReport | null>(null);
  const [projectPnl, setProjectPnl] = useState<ProjectPnlReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const reportQueryParams = useMemo((): FinanceReportQueryParams => {
    const periodParams = getFinancePeriodParams(period);
    return {
      dateFrom: periodParams?.dateFrom,
      dateTo: periodParams?.dateTo,
    };
  }, [period]);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const [
        definitions,
        companyPnlReport,
        cashFlowReport,
        expensePlanVsActualReport,
        mrrSubscriptionRevenueReport,
        payrollReportData,
        projectPnlReport,
      ] = await Promise.all([
        financeReportsApi.getDefinitions(),
        financeReportsApi.getCompanyPnl(reportQueryParams),
        financeReportsApi.getCashFlow(reportQueryParams),
        financeReportsApi.getExpensePlanVsActual(reportQueryParams),
        financeReportsApi.getMrrSubscriptionRevenue(reportQueryParams),
        financeReportsApi.getPayrollReport(reportQueryParams),
        financeReportsApi.getProjectPnl(reportQueryParams),
      ]);
      setData(definitions);
      setCompanyPnl(companyPnlReport);
      setCashFlow(cashFlowReport);
      setExpensePlanVsActual(expensePlanVsActualReport);
      setMrrSubscriptionRevenue(mrrSubscriptionRevenueReport);
      setPayrollReport(payrollReportData);
      setProjectPnl(projectPnlReport);
      setError(null);
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Finance report definitions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [reportQueryParams]);

  useEffect(() => {
    void fetchDefinitions();
  }, [fetchDefinitions]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setPeriod('month');
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      search: buildFinanceOverviewHeroSearch({
        search,
        onSearchChange: setSearch,
        searchPlaceholder: 'Search reports by title or description…',
        period,
        onPeriodChange: setPeriod,
        onClearAll: handleClearFilters,
      }),
      trailing: (
        <FinanceOverviewPageSettingsSheet
          title="Finance reports — settings"
          description="Reload report definitions and snapshots for the selected period."
          triggerAriaLabel="Finance reports settings"
          refreshDisabled={loading}
          onRefresh={() => void fetchDefinitions()}
        />
      ),
    }),
    [fetchDefinitions, handleClearFilters, loading, period, search],
  );

  useModuleHeroSlots(moduleHeroSlots);

  const query = search.trim().toLowerCase();

  const filteredDefinitions = useMemo(() => {
    if (!data || !query) return data?.items ?? [];
    return data.items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    );
  }, [data, query]);

  if (loading) return <LoadingState variant="cards" count={6} />;

  if (!data) {
    return (
      <ErrorState
        title="Finance reports unavailable"
        description={error ?? 'Could not load Finance report definitions.'}
        onRetry={fetchDefinitions}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card rounded-2xl border p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700">
            <BarChart3 size={20} aria-hidden />
          </div>
          <div>
            <p className="text-foreground font-medium">{data.meta.scope}</p>
            <p className="text-muted-foreground mt-1 text-sm">{data.meta.phase6Boundary}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {companyPnl && reportMatchesSearch(companyPnl.title, query) ? (
          <CompanyPnlSnapshot report={companyPnl} />
        ) : null}
        {cashFlow && reportMatchesSearch(cashFlow.title, query) ? (
          <CashFlowSnapshot report={cashFlow} />
        ) : null}
        {expensePlanVsActual && reportMatchesSearch(expensePlanVsActual.title, query) ? (
          <ExpensePlanVsActualSnapshot report={expensePlanVsActual} />
        ) : null}
        {mrrSubscriptionRevenue && reportMatchesSearch(mrrSubscriptionRevenue.title, query) ? (
          <MrrSubscriptionRevenueSnapshot report={mrrSubscriptionRevenue} />
        ) : null}
        {payrollReport && reportMatchesSearch(payrollReport.title, query) ? (
          <PayrollReportSnapshot report={payrollReport} />
        ) : null}
        {projectPnl && reportMatchesSearch(projectPnl.title, query) ? (
          <ProjectPnlSnapshot report={projectPnl} />
        ) : null}
        {filteredDefinitions.map((definition) => (
          <ReportDefinitionCard key={definition.id} definition={definition} />
        ))}
      </section>

      {query && filteredDefinitions.length === 0 && !hasSnapshotMatch(query) ? (
        <p className="text-muted-foreground text-sm">No reports match your search.</p>
      ) : null}
    </div>
  );
}

function reportMatchesSearch(title: string, query: string): boolean {
  if (!query) return true;
  return title.toLowerCase().includes(query);
}

function hasSnapshotMatch(query: string): boolean {
  const titles = [
    'Company P&L',
    'Cash Flow',
    'Expense Plan vs Actual',
    'MRR / Subscription Revenue',
    'Payroll Report',
    'Project P&L',
  ];
  return titles.some((title) => reportMatchesSearch(title, query));
}

function ReportDefinitionCard({ definition }: { definition: FinanceReportDefinition }) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-foreground text-lg font-semibold">{definition.title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${financeReportStatusClass(
            definition.v1Status,
          )}`}
        >
          {financeReportStatusLabel(definition.v1Status)}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoBlock title="Phase 3 scope" lines={[definition.phase3Scope]} />
        <InfoBlock title="Phase 6 deferred" lines={[definition.phase6Deferred]} />
        <InfoBlock title="Audience" lines={definition.audience} />
        <InfoBlock title="Source endpoints" lines={definition.sourceEndpoints} />
        {definition.aggregateEndpoint ? (
          <InfoBlock title="Aggregate endpoint" lines={[definition.aggregateEndpoint]} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {definition.drillDownHrefs.map((href) => (
          <Link
            key={href}
            href={href}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            {href}
            <ArrowUpRight size={12} aria-hidden />
          </Link>
        ))}
      </div>
    </article>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-foreground text-sm">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
