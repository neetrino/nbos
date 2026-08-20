import {
  reportsApi,
  type ReportDataQualityWarning,
  type ReportDefinition,
  type ReportExportJob,
  type ReportSchedule,
  type SavedReportView,
} from '@/lib/api/reports';
import type { ReportsViewId } from './reports-routing';

export interface ReportsCenterShellData {
  definitions: ReportDefinition[];
  exportJobs: ReportExportJob[];
  schedules: ReportSchedule[];
  savedViews: SavedReportView[];
  warnings: ReportDataQualityWarning[];
}

export async function loadReportShellData(): Promise<ReportsCenterShellData> {
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

export function filterReportDefinitions(
  definitions: ReportDefinition[],
  view: ReportsViewId,
  search: string,
): ReportDefinition[] {
  const q = search.trim().toLowerCase();
  return definitions.filter((definition) => {
    if (definition.category !== view) return false;
    if (!q) return true;
    return [definition.title, definition.description, definition.category, ...definition.audience]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}
