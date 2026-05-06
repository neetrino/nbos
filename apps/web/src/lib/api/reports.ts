import { api } from '../api';
import type { FileAsset } from './drive';

export type ReportExportFormat = 'CSV' | 'XLSX' | 'PDF';
export type ReportOwnerModule =
  | 'FINANCE'
  | 'CRM'
  | 'MARKETING'
  | 'PROJECTS'
  | 'COMPANY'
  | 'SUPPORT'
  | 'PARTNERS'
  | 'CREDENTIALS';
export type ReportCategory =
  | 'EXECUTIVE'
  | 'FINANCE'
  | 'SALES'
  | 'MARKETING'
  | 'PROJECTS'
  | 'SPECIALISTS'
  | 'SUPPORT'
  | 'PARTNERS'
  | 'SECURITY';
export type ReportExportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ReportScheduleStatus = 'ACTIVE' | 'PAUSED' | 'FAILED' | 'ARCHIVED';
export type ReportScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportDataQualitySeverity = 'INFO' | 'WARNING';

export interface ReportDefinition {
  key: string;
  title: string;
  category: ReportCategory;
  ownerModule: ReportOwnerModule;
  description: string;
  audience: string[];
  supportedFilters: string[];
  supportedExports: ReportExportFormat[];
  visualizations: string[];
  sourceEndpoints: string[];
  drillDownHrefs: string[];
  requiredPermissions: Array<{ module: string; action: string }>;
  status: 'READY' | 'PARTIAL' | 'PLANNED';
  dataQualityNotes: string[];
  dataEndpoint?: string;
}

export interface ReportDefinitionsResponse {
  items: ReportDefinition[];
  meta: { count: number; scope: string };
}

export interface ReportExportJob {
  id: string;
  reportKey: string;
  reportTitle: string;
  ownerModule: ReportOwnerModule;
  format: ReportExportFormat;
  status: ReportExportJobStatus;
  requestedById: string;
  filters: Record<string, string | number | boolean | null> | null;
  fileAssetId: string | null;
  fileAsset: FileAsset | null;
  errorMessage: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  id: string;
  reportKey: string;
  reportTitle: string;
  ownerModule: ReportOwnerModule;
  format: ReportExportFormat;
  status: ReportScheduleStatus;
  ownerId: string;
  recipientEmails: string[];
  scheduleLabel: string;
  filters: Record<string, string | number | boolean | null> | null;
  frequency: ReportScheduleFrequency;
  timezone: string;
  timeOfDay: string;
  startDate: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  nextRunAt: string;
  lastRunAt: string | null;
  lastExportJobId: string | null;
  lastFailureAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedReportView {
  id: string;
  reportKey: string;
  reportTitle: string;
  ownerModule: ReportOwnerModule;
  name: string;
  filters: Record<string, string | number | boolean | null> | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDataQualityWarning {
  reportKey: string;
  reportTitle: string;
  ownerModule: ReportOwnerModule;
  severity: ReportDataQualitySeverity;
  code: string;
  message: string;
  sourceEndpoints: string[];
}

export interface ReportDataQualityWarningsResponse {
  items: ReportDataQualityWarning[];
  meta: { count: number };
}

export const reportsApi = {
  async listDefinitions(): Promise<ReportDefinitionsResponse> {
    const resp = await api.get<ReportDefinitionsResponse>('/api/reports/definitions');
    return resp.data;
  },

  async listExportJobs(): Promise<ReportExportJob[]> {
    const resp = await api.get<ReportExportJob[]>('/api/reports/export-jobs');
    return resp.data;
  },

  async createExportJob(data: {
    reportKey: string;
    ownerModule?: ReportOwnerModule;
    format: ReportExportFormat;
    filters?: Record<string, string | number | boolean | null>;
  }): Promise<ReportExportJob> {
    const resp = await api.post<ReportExportJob>('/api/reports/export-jobs', data);
    return resp.data;
  },

  async retryExportJob(jobId: string): Promise<ReportExportJob> {
    const resp = await api.post<ReportExportJob>(`/api/reports/export-jobs/${jobId}/retry`);
    return resp.data;
  },

  async cancelExportJob(jobId: string): Promise<ReportExportJob> {
    const resp = await api.post<ReportExportJob>(`/api/reports/export-jobs/${jobId}/cancel`);
    return resp.data;
  },

  async listSchedules(): Promise<ReportSchedule[]> {
    const resp = await api.get<ReportSchedule[]>('/api/reports/schedules');
    return resp.data;
  },

  async createSchedule(data: {
    reportKey: string;
    ownerModule?: ReportOwnerModule;
    format: ReportExportFormat;
    recipientEmails: string[];
    scheduleLabel: string;
    frequency: ReportScheduleFrequency;
    timezone?: string;
    timeOfDay: string;
    startDate?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    filters?: Record<string, string | number | boolean | null>;
  }): Promise<ReportSchedule> {
    const resp = await api.post<ReportSchedule>('/api/reports/schedules', data);
    return resp.data;
  },

  async listSavedViews(): Promise<SavedReportView[]> {
    const resp = await api.get<SavedReportView[]>('/api/reports/saved-views');
    return resp.data;
  },

  async createSavedView(data: {
    reportKey: string;
    ownerModule?: ReportOwnerModule;
    name: string;
    filters?: Record<string, string | number | boolean | null>;
  }): Promise<SavedReportView> {
    const resp = await api.post<SavedReportView>('/api/reports/saved-views', data);
    return resp.data;
  },

  async pauseSchedule(scheduleId: string): Promise<ReportSchedule> {
    const resp = await api.post<ReportSchedule>(`/api/reports/schedules/${scheduleId}/pause`);
    return resp.data;
  },

  async resumeSchedule(scheduleId: string): Promise<ReportSchedule> {
    const resp = await api.post<ReportSchedule>(`/api/reports/schedules/${scheduleId}/resume`);
    return resp.data;
  },

  async archiveSchedule(scheduleId: string): Promise<ReportSchedule> {
    const resp = await api.post<ReportSchedule>(`/api/reports/schedules/${scheduleId}/archive`);
    return resp.data;
  },

  async listDataQualityWarnings(): Promise<ReportDataQualityWarningsResponse> {
    const resp = await api.get<ReportDataQualityWarningsResponse>(
      '/api/reports/data-quality-warnings',
    );
    return resp.data;
  },
};
