'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { financeReportsApi } from '@/lib/api/finance-reports';
import { leadsApi } from '@/lib/api/leads';
import { dealsApi } from '@/lib/api/deals';
import { marketingApi } from '@/lib/api/marketing';
import { productsApi } from '@/lib/api/products';
import { extensionsApi } from '@/lib/api/extensions';
import { tasksApi } from '@/lib/api/tasks';
import {
  reportsApi,
  type ReportCategory,
  type ReportDataQualityWarning,
  type ReportDefinition,
  type ReportExportJob,
  type ReportSchedule,
  type SavedReportView,
} from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ReportsDataQualityPanel } from './ReportsDataQualityPanel';
import { ReportsSchedulePanel } from './ReportsSchedulePanel';
import { ReportExportHistory } from './ReportExportHistory';
import { ReportFilterBar } from './ReportFilterBar';
import { ReportCatalog } from './ReportCatalog';
import {
  buildInitialReportFilters,
  buildReportFilters,
  type ReportFilterState,
} from '../report-filters';
import { EMPTY_REPORT_PREVIEW_DATA, type ReportPreviewData } from '../report-preview-model';

type ReportsView = ReportCategory | 'ALL' | 'SCHEDULED' | 'EXPORTS' | 'QUALITY';

const REPORT_VIEWS: Array<{ id: ReportsView; label: string }> = [
  { id: 'ALL', label: 'All reports' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'SALES', label: 'Sales' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'PROJECTS', label: 'Projects' },
  { id: 'SPECIALISTS', label: 'Specialists' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'EXPORTS', label: 'Exports' },
  { id: 'QUALITY', label: 'Data quality' },
];

export function ReportsCenter() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [previewData, setPreviewData] = useState<ReportPreviewData>(EMPTY_REPORT_PREVIEW_DATA);
  const [exportJobs, setExportJobs] = useState<ReportExportJob[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [savedViews, setSavedViews] = useState<SavedReportView[]>([]);
  const [warnings, setWarnings] = useState<ReportDataQualityWarning[]>([]);
  const [view, setView] = useState<ReportsView>('ALL');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ReportFilterState>(buildInitialReportFilters());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingExportKey, setCreatingExportKey] = useState<string | null>(null);

  const exportFilters = useMemo(() => buildReportFilters(filters), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadReportCenterData(exportFilters);
      setDefinitions(loaded.definitions);
      setPreviewData(loaded.previewData);
      setExportJobs(loaded.exportJobs);
      setSchedules(loaded.schedules);
      setSavedViews(loaded.savedViews);
      setWarnings(loaded.warnings);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Reports center could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [exportFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleDefinitions = useMemo(
    () => filterDefinitions(definitions, view, search),
    [definitions, view, search],
  );

  async function requestExport(definition: ReportDefinition) {
    setCreatingExportKey(definition.key);
    setError(null);
    try {
      const job = await reportsApi.createExportJob({
        reportKey: definition.key,
        ownerModule: definition.ownerModule,
        format: 'CSV',
        filters: exportFilters,
      });
      setExportJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setView('EXPORTS');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export job could not be requested.'));
    } finally {
      setCreatingExportKey(null);
    }
  }

  if (loading) return <LoadingState variant="cards" count={6} />;
  if (error) return <ErrorState title="Reports unavailable" description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <ReportsHeader onRefresh={() => void load()} />
      <ReportSummary definitions={definitions} exportJobs={exportJobs} schedules={schedules} />
      <ReportViewTabs view={view} onViewChange={setView} />
      <ReportFilterBar
        definitions={definitions}
        filters={filters}
        search={search}
        savedViews={savedViews}
        onFiltersChange={setFilters}
        onSearchChange={setSearch}
        onSavedViewsChange={setSavedViews}
      />
      {view === 'SCHEDULED' ? (
        <ReportsSchedulePanel
          definitions={definitions}
          schedules={schedules}
          filters={exportFilters}
          onSchedulesChange={setSchedules}
          onRefresh={() => void load()}
        />
      ) : view === 'EXPORTS' ? (
        <ReportExportHistory jobs={exportJobs} onRefresh={() => void load()} />
      ) : view === 'QUALITY' ? (
        <ReportsDataQualityPanel warnings={warnings} onRefresh={() => void load()} />
      ) : (
        <ReportCatalog
          definitions={visibleDefinitions}
          filters={exportFilters}
          previewData={previewData}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      )}
    </div>
  );
}

function ReportsHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <PageHeader
      title="Reports / Analytics"
      description="Full report center for Finance, Sales, Marketing, Projects and Specialist KPI analysis."
    >
      <Button type="button" variant="outline" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </PageHeader>
  );
}

function ReportSummary({
  definitions,
  exportJobs,
  schedules,
}: {
  definitions: ReportDefinition[];
  exportJobs: ReportExportJob[];
  schedules: ReportSchedule[];
}) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <SummaryCard label="Reports" value={definitions.length} />
      <SummaryCard
        label="Directions"
        value={new Set(definitions.map((item) => item.category)).size}
      />
      <SummaryCard label="Scheduled" value={schedules.length} />
      <SummaryCard label="Exports" value={exportJobs.length} />
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <BarChart3 size={17} />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function ReportViewTabs({
  view,
  onViewChange,
}: {
  view: ReportsView;
  onViewChange: (view: ReportsView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {REPORT_VIEWS.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={view === item.id ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onViewChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function filterDefinitions(
  definitions: ReportDefinition[],
  view: ReportsView,
  search: string,
): ReportDefinition[] {
  const q = search.trim().toLowerCase();
  return definitions.filter((definition) => {
    const viewMatches = view === 'ALL' || definition.category === view;
    if (!viewMatches) return false;
    if (!q) return true;
    return [definition.title, definition.description, definition.category, ...definition.audience]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

async function loadReportCenterData(filters: Record<string, string>) {
  const [
    definitions,
    exportJobs,
    schedules,
    savedViews,
    quality,
    finance,
    leads,
    deals,
    marketing,
    products,
    extensions,
    tasks,
  ] = await Promise.all([
    reportsApi.listDefinitions(),
    reportsApi.listExportJobs(),
    reportsApi.listSchedules(),
    reportsApi.listSavedViews(),
    reportsApi.listDataQualityWarnings(),
    loadFinancePreviewData(filters),
    leadsApi.getStats(),
    dealsApi.getStats(),
    marketingApi.getDashboardSummary(),
    productsApi.getStats(),
    extensionsApi.getStats(),
    tasksApi.getStats(),
  ]);
  return {
    definitions: definitions.items,
    exportJobs,
    schedules,
    savedViews,
    warnings: quality.items,
    previewData: { finance, leads, deals, marketing, products, extensions, tasks },
  };
}

async function loadFinancePreviewData(filters: Record<string, string>) {
  const [
    companyPnl,
    cashFlow,
    expensePlanVsActual,
    mrrSubscriptionRevenue,
    payrollReport,
    projectPnl,
  ] = await Promise.all([
    financeReportsApi.getCompanyPnl(filters),
    financeReportsApi.getCashFlow(filters),
    financeReportsApi.getExpensePlanVsActual(filters),
    financeReportsApi.getMrrSubscriptionRevenue(filters),
    financeReportsApi.getPayrollReport(filters),
    financeReportsApi.getProjectPnl(filters),
  ]);
  return {
    companyPnl,
    cashFlow,
    expensePlanVsActual,
    mrrSubscriptionRevenue,
    payrollReport,
    projectPnl,
  };
}
