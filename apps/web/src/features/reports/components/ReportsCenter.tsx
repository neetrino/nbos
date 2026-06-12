'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorState, LoadingState } from '@/components/shared';
import { useModuleHeroSlots } from '@/components/shared/page-hero';
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
import { REPORTS_SECTION_DEFAULTS } from '@/lib/navigation/module-last-visit/reports-visit-config';
import { buildReportsHeroSearch } from './build-reports-hero-search';
import { reportViewLabel } from './ReportsCenterChrome';
import { ReportsPageSettingsSheet } from './ReportsPageSettingsSheet';
import { ReportsDataQualityPanel } from './ReportsDataQualityPanel';
import { ReportsSchedulePanel } from './ReportsSchedulePanel';
import { ReportExportHistory } from './ReportExportHistory';
import { ReportActions } from './tabs/ReportActions';
import {
  buildInitialReportFilters,
  buildReportFilters,
  type ReportFilterState,
} from '../report-filters';
import { buildReportsViewPath, parseReportsPathname, type ReportsViewId } from '../reports-routing';
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
  const pathname = usePathname();
  const router = useRouter();
  const parsedPath = parseReportsPathname(pathname);
  const view = parsedPath?.viewId ?? 'FINANCE';

  useEffect(() => {
    if (!parsedPath) {
      router.replace(REPORTS_SECTION_DEFAULTS.finance);
    }
  }, [parsedPath, router]);

  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [exportJobs, setExportJobs] = useState<ReportExportJob[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [savedViews, setSavedViews] = useState<SavedReportView[]>([]);
  const [warnings, setWarnings] = useState<ReportDataQualityWarning[]>([]);
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

  const requestExport = useCallback(
    async (definition: ReportDefinition, format: ReportExportFormat) => {
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
        router.push(buildReportsViewPath('EXPORTS'));
      } catch (caught) {
        setError(getApiErrorMessage(caught, 'Report export job could not be requested.'));
      } finally {
        setCreatingExportToken(null);
      }
    },
    [exportFilters, router],
  );

  async function retryExport(jobId: string) {
    setError(null);
    try {
      const retried = await reportsApi.retryExportJob(jobId);
      setExportJobs((current) => [retried, ...current.filter((item) => item.id !== retried.id)]);
      router.push(buildReportsViewPath('EXPORTS'));
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
      router.push(buildReportsViewPath('EXPORTS'));
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Report export cancel could not be completed.'));
    }
  }

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilters(buildInitialReportFilters());
  }, []);

  const showReportActions = isReportDataView(view);

  const moduleHeroSlots = useMemo(
    () => ({
      search: buildReportsHeroSearch({
        search,
        onSearchChange: setSearch,
        filters,
        onFiltersChange: setFilters,
        savedViews,
        onClearAll: handleClearFilters,
      }),
      trailing: showReportActions ? (
        <ReportsPageSettingsSheet
          title={`${reportViewLabel(view)} — settings`}
          description="Download report files for the current filters."
          triggerAriaLabel={`${reportViewLabel(view)} settings`}
        >
          <ReportActions
            definitions={visibleDefinitions}
            creatingExportToken={creatingExportToken}
            onExport={(definition, format) => void requestExport(definition, format)}
          />
        </ReportsPageSettingsSheet>
      ) : null,
    }),
    [
      creatingExportToken,
      filters,
      handleClearFilters,
      requestExport,
      savedViews,
      search,
      showReportActions,
      view,
      visibleDefinitions,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  if (!parsedPath) return <LoadingState variant="cards" count={6} />;

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
        <FinanceReportsTab state={finance} />
      ) : view === 'SALES' ? (
        <SalesReportsTab state={sales} />
      ) : view === 'MARKETING' ? (
        <MarketingReportsTab state={marketing} />
      ) : view === 'PROJECTS' ? (
        <ProjectsReportsTab state={projects} />
      ) : (
        <SpecialistsReportsTab state={specialists} />
      )}
    </div>
  );
}

function filterDefinitions(
  definitions: ReportDefinition[],
  view: ReportsViewId,
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

function isReportDataView(view: ReportsViewId): boolean {
  return (
    view === 'FINANCE' ||
    view === 'SALES' ||
    view === 'MARKETING' ||
    view === 'PROJECTS' ||
    view === 'SPECIALISTS'
  );
}
