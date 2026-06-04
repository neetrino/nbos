'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import { PAGE_HERO_TAB_SCROLL, useModuleHeroSlots } from '@/components/shared/page-hero';
import { Button } from '@/components/ui/button';
import {
  reportsApi,
  type ReportDataQualityWarning,
  type ReportDefinition,
  type ReportExportFormat,
  type ReportExportJob,
  type ReportSchedule,
  type SavedReportView,
} from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ReportsViewTabs, type ReportsView } from './ReportsCenterChrome';
import { buildReportsHeroSearch } from './build-reports-hero-search';
import { ReportsDataQualityPanel } from './ReportsDataQualityPanel';
import { ReportsSchedulePanel } from './ReportsSchedulePanel';
import { ReportExportHistory } from './ReportExportHistory';
import {
  buildInitialReportFilters,
  buildReportFilters,
  type ReportFilterState,
} from '../report-filters';
import {
  useFinanceReportsTabData,
  useMarketingReportsTabData,
  useProjectsReportsTabData,
  useSalesReportsTabData,
  useSpecialistsReportsTabData,
} from '../hooks/useReportTabData';
import { FinanceReportsTab } from './tabs/FinanceReportsTab';
import { MarketingReportsTab } from './tabs/MarketingReportsTab';
import { ProjectsReportsTab } from './tabs/ProjectsReportsTab';
import { SalesReportsTab } from './tabs/SalesReportsTab';
import { SpecialistsReportsTab } from './tabs/SpecialistsReportsTab';

export function ReportsCenter() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [exportJobs, setExportJobs] = useState<ReportExportJob[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [savedViews, setSavedViews] = useState<SavedReportView[]>([]);
  const [warnings, setWarnings] = useState<ReportDataQualityWarning[]>([]);
  const [view, setView] = useState<ReportsView>('FINANCE');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ReportFilterState>(buildInitialReportFilters());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingExportToken, setCreatingExportToken] = useState<string | null>(null);

  const exportFilters = useMemo(() => buildReportFilters(filters), [filters]);
  const finance = useFinanceReportsTabData(view === 'FINANCE', filters);
  const sales = useSalesReportsTabData(view === 'SALES', filters);
  const marketing = useMarketingReportsTabData(view === 'MARKETING', filters);
  const projects = useProjectsReportsTabData(view === 'PROJECTS', filters);
  const specialists = useSpecialistsReportsTabData(view === 'SPECIALISTS', filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadReportShellData();
      setDefinitions(loaded.definitions);
      setExportJobs(loaded.exportJobs);
      setSchedules(loaded.schedules);
      setSavedViews(loaded.savedViews);
      setWarnings(loaded.warnings);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Reports center could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleDefinitions = useMemo(
    () => filterDefinitions(definitions, view, search),
    [definitions, view, search],
  );

  async function requestExport(definition: ReportDefinition, format: ReportExportFormat) {
    setCreatingExportToken(`${definition.key}:${format}`);
    setError(null);
    try {
      const job = await reportsApi.createExportJob({
        reportKey: definition.key,
        ownerModule: definition.ownerModule,
        format,
        filters: exportFilters,
      });
      setExportJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setView('EXPORTS');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export job could not be requested.'));
    } finally {
      setCreatingExportToken(null);
    }
  }

  const getTabRefresh = useCallback(
    (viewId: ReportsView) => {
      if (viewId === 'FINANCE') return finance.refresh;
      if (viewId === 'SALES') return sales.refresh;
      if (viewId === 'MARKETING') return marketing.refresh;
      if (viewId === 'PROJECTS') return projects.refresh;
      if (viewId === 'SPECIALISTS') return specialists.refresh;
      return null;
    },
    [finance.refresh, marketing.refresh, projects.refresh, sales.refresh, specialists.refresh],
  );

  const handleRefresh = useCallback(() => {
    void refreshActiveView(view, load, getTabRefresh);
  }, [getTabRefresh, load, view]);

  async function retryExport(jobId: string) {
    setError(null);
    try {
      const retried = await reportsApi.retryExportJob(jobId);
      setExportJobs((current) => [retried, ...current.filter((item) => item.id !== retried.id)]);
      setView('EXPORTS');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export retry could not be requested.'));
    }
  }

  async function cancelExport(jobId: string) {
    setError(null);
    try {
      const cancelled = await reportsApi.cancelExportJob(jobId);
      setExportJobs((current) =>
        current.map((item) => (item.id === cancelled.id ? cancelled : item)),
      );
      setView('EXPORTS');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export cancel could not be completed.'));
    }
  }

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilters(buildInitialReportFilters());
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      tabs: (
        <div className={PAGE_HERO_TAB_SCROLL}>
          <ReportsViewTabs view={view} onViewChange={setView} />
        </div>
      ),
      search: buildReportsHeroSearch({
        search,
        onSearchChange: setSearch,
        filters,
        onFiltersChange: setFilters,
        savedViews,
        onClearAll: handleClearFilters,
      }),
      trailing: (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh reports"
          title="Refresh"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </Button>
      ),
    }),
    [filters, handleClearFilters, handleRefresh, loading, savedViews, search, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  if (loading) return <LoadingState variant="cards" count={6} />;
  if (error) return <ErrorState title="Reports unavailable" description={error} onRetry={load} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
      {view === 'SCHEDULED' ? (
        <ReportsSchedulePanel
          definitions={definitions}
          schedules={schedules}
          filters={exportFilters}
          onSchedulesChange={setSchedules}
          onRefresh={() => void load()}
        />
      ) : view === 'EXPORTS' ? (
        <ReportExportHistory
          jobs={exportJobs}
          onRefresh={() => void load()}
          onRetry={(jobId) => void retryExport(jobId)}
          onCancel={(jobId) => void cancelExport(jobId)}
        />
      ) : view === 'QUALITY' ? (
        <ReportsDataQualityPanel warnings={warnings} onRefresh={() => void load()} />
      ) : view === 'FINANCE' ? (
        <FinanceReportsTab
          definitions={visibleDefinitions}
          state={finance}
          creatingExportToken={creatingExportToken}
          onExport={(definition, format) => void requestExport(definition, format)}
        />
      ) : view === 'SALES' ? (
        <SalesReportsTab
          definitions={visibleDefinitions}
          state={sales}
          creatingExportToken={creatingExportToken}
          onExport={(definition, format) => void requestExport(definition, format)}
        />
      ) : view === 'MARKETING' ? (
        <MarketingReportsTab
          definitions={visibleDefinitions}
          state={marketing}
          creatingExportToken={creatingExportToken}
          onExport={(definition, format) => void requestExport(definition, format)}
        />
      ) : view === 'PROJECTS' ? (
        <ProjectsReportsTab
          definitions={visibleDefinitions}
          state={projects}
          creatingExportToken={creatingExportToken}
          onExport={(definition, format) => void requestExport(definition, format)}
        />
      ) : (
        <SpecialistsReportsTab
          definitions={visibleDefinitions}
          state={specialists}
          creatingExportToken={creatingExportToken}
          onExport={(definition, format) => void requestExport(definition, format)}
        />
      )}
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
    const viewMatches = definition.category === view;
    if (!viewMatches) return false;
    if (!q) return true;
    return [definition.title, definition.description, definition.category, ...definition.audience]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

async function loadReportShellData() {
  const [definitions, exportJobs, schedules, savedViews, quality] = await Promise.all([
    reportsApi.listDefinitions(),
    reportsApi.listExportJobs(),
    reportsApi.listSchedules(),
    reportsApi.listSavedViews(),
    reportsApi.listDataQualityWarnings(),
  ]);
  return {
    definitions: definitions.items,
    exportJobs,
    schedules,
    savedViews,
    warnings: quality.items,
  };
}

function refreshActiveView(
  view: ReportsView,
  reloadShell: () => Promise<void>,
  getTabRefresh: (view: ReportsView) => (() => void) | null,
) {
  const refresh = getTabRefresh(view);
  if (refresh) {
    refresh();
    return;
  }
  void reloadShell();
}
