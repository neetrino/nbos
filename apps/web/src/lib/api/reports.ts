import { api } from '../api';
import type { FileAsset } from './drive';

export type ReportExportFormat = 'CSV' | 'XLSX' | 'PDF';
export type ReportExportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ReportScheduleStatus = 'ACTIVE' | 'PAUSED' | 'FAILED' | 'ARCHIVED';
export type ReportScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportDataQualitySeverity = 'INFO' | 'WARNING';

export interface ReportExportJob {
  id: string;
  reportKey: string;
  reportTitle: string;
  ownerModule: string;
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
  ownerModule: string;
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

export interface ReportDataQualityWarning {
  reportKey: string;
  reportTitle: string;
  ownerModule: string;
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
  async listExportJobs(): Promise<ReportExportJob[]> {
    const resp = await api.get<ReportExportJob[]>('/api/reports/export-jobs');
    return resp.data;
  },

  async createExportJob(data: {
    reportKey: string;
    ownerModule?: 'FINANCE';
    format: ReportExportFormat;
    filters?: Record<string, string | number | boolean | null>;
  }): Promise<ReportExportJob> {
    const resp = await api.post<ReportExportJob>('/api/reports/export-jobs', data);
    return resp.data;
  },

  async listSchedules(): Promise<ReportSchedule[]> {
    const resp = await api.get<ReportSchedule[]>('/api/reports/schedules');
    return resp.data;
  },

  async createSchedule(data: {
    reportKey: string;
    ownerModule?: 'FINANCE';
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
