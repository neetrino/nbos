import type { ReportExportJob } from '@/lib/api/reports';

type ReportExportJobActionSource = Pick<ReportExportJob, 'status' | 'fileAsset'>;

export function canRetryReportExport(job: Pick<ReportExportJob, 'status'>): boolean {
  return job.status === 'FAILED' || job.status === 'CANCELLED';
}

export function isActiveReportExport(job: Pick<ReportExportJob, 'status'>): boolean {
  return job.status === 'QUEUED' || job.status === 'PROCESSING';
}

export function canCancelReportExport(job: Pick<ReportExportJob, 'status'>): boolean {
  return isActiveReportExport(job);
}

export function canDownloadReportExport(job: ReportExportJobActionSource): boolean {
  return job.status === 'COMPLETED' && Boolean(job.fileAsset?.id);
}
