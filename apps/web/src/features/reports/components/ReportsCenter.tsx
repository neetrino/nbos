'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import {
  reportsApi,
  type ReportDataQualityWarning,
  type ReportDefinition,
  type ReportExportJob,
  type ReportSchedule,
  type SavedReportView,
} from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ReportsHeader, ReportViewTabs, type ReportsView } from './ReportsCenterChrome';
import { ReportsDataQualityPanel } from './ReportsDataQualityPanel';
import { ReportsSchedulePanel } from './ReportsSchedulePanel';
import { ReportExportHistory } from './ReportExportHistory';
import { ReportFilterBar } from './ReportFilterBar';
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
  const [creatingExportKey, setCreatingExportKey] = useState<string | null>(null);

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
      <ReportsHeader
        view={view}
        onRefresh={() => void refreshActiveView(view, load, tabRefreshers)}
      />
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
      ) : view === 'FINANCE' ? (
        <FinanceReportsTab
          definitions={visibleDefinitions}
          state={finance}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      ) : view === 'SALES' ? (
        <SalesReportsTab
          definitions={visibleDefinitions}
          state={sales}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      ) : view === 'MARKETING' ? (
        <MarketingReportsTab
          definitions={visibleDefinitions}
          state={marketing}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      ) : view === 'PROJECTS' ? (
        <ProjectsReportsTab
          definitions={visibleDefinitions}
          state={projects}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      ) : (
        <SpecialistsReportsTab
          definitions={visibleDefinitions}
          state={specialists}
          creatingExportKey={creatingExportKey}
          onExport={(definition) => void requestExport(definition)}
        />
      )}
    </div>
  );

  function tabRefreshers(viewId: ReportsView) {
    if (viewId === 'FINANCE') return finance.refresh;
    if (viewId === 'SALES') return sales.refresh;
    if (viewId === 'MARKETING') return marketing.refresh;
    if (viewId === 'PROJECTS') return projects.refresh;
    if (viewId === 'SPECIALISTS') return specialists.refresh;
    return null;
  }
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
