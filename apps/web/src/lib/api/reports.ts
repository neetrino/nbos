import { api } from '../api';
import type { FileAsset } from './drive';

export type ReportExportFormat = 'CSV' | 'XLSX' | 'PDF';
export type ReportExportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

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
};
